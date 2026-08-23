import jwt from 'jsonwebtoken';
import http from 'node:http';
import https from 'node:https';
import proverbService from '../services/proverbService.js';
import { createProverbValidator, updateProverbValidator } from '../validators/proverbValidator.js';

function requestJson(urlStr, { method = 'GET', headers = {}, body = null, rejectUnauthorized = true } = {}) {
    const url = new URL(urlStr);
    const client = url.protocol === 'https:' ? https : http;
    
    const postData = body ? (typeof body === 'string' ? body : JSON.stringify(body)) : null;
    const requestHeaders = { ...headers };
    if (postData) {
        requestHeaders['Content-Length'] = Buffer.byteLength(postData);
    }

    const requestOptions = {
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: url.pathname + url.search,
        method: method.toUpperCase(),
        headers: requestHeaders,
    };

    if (url.protocol === 'https:') {
        requestOptions.rejectUnauthorized = rejectUnauthorized;
    }

    return new Promise((resolve, reject) => {
        const req = client.request(requestOptions, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                let parsed = data;
                try {
                    parsed = JSON.parse(data);
                } catch (e) {
                    // keep raw data
                }
                resolve({
                    ok: res.statusCode >= 200 && res.statusCode < 300,
                    status: res.statusCode,
                    headers: res.headers,
                    json: async () => parsed,
                    text: async () => data,
                });
            });
        });

        req.on('error', (err) => {
            reject(err);
        });

        if (postData) {
            req.write(postData);
        }
        req.end();
    });
}

function normalizeFormPayload(body) {
    const payload = { ...body };

    if (typeof payload.tags === 'string') {
        payload.tags = payload.tags
            .split(',')
            .map((tag) => tag.trim())
            .filter(Boolean);
    }

    Object.keys(payload).forEach((key) => {
        if (payload[key] === '') {
            payload[key] = undefined;
        }
    });

    return payload;
}

export function getWebController(cnf, log) {
    return {
        async renderHome(req, res, next) {
            try {
                let randomProverb = null;
                try {
                    randomProverb = await proverbService.getRandomProverb({});
                } catch (e) {
                    log.info('No random quote found (DB might be empty)');
                }
                const filterOptions = await proverbService.getFilterOptions();
                const result = await proverbService.getProverbs(req.query);
                
                res.render('proverbs/home', {
                    title: 'Proverbs Portal',
                    randomProverb,
                    proverbs: result.proverbs,
                    pagination: result.pagination,
                    filterOptions,
                    query: req.query,
                });
            } catch (error) {
                next(error);
            }
        },
        async apiRandomProverb(req, res, next) {
            try {
                const proverb = await proverbService.getRandomProverb({});
                res.json({ success: true, proverb });
            } catch (error) {
                res.status(404).json({ success: false, error: error.message });
            }
        },
        async renderAdminDashboard(req, res, next) {
            try {
                const result = await proverbService.getProverbs(req.query);
                res.render('proverbs/admin_dashboard', {
                    title: 'Admin Dashboard',
                    proverbs: result.proverbs,
                    pagination: result.pagination,
                    query: req.query,
                });
            } catch (error) {
                next(error);
            }
        },
        async renderNew(req, res, next) {
            try {
                res.render('proverbs/form', {
                    title: 'Create Proverb',
                    submitLabel: 'Create',
                    action: '/admin/new',
                });
            } catch (error) {
                next(error);
            }
        },
        async createProverb(req, res, next) {
            try {
                const payload = normalizeFormPayload(req.body);
                const validated = await createProverbValidator.validate(payload);
                await proverbService.createProverb(validated);
                res.redirect('/admin');
            } catch (error) {
                if (error.messages) {
                    const errors = {};
                    error.messages.forEach((err) => {
                        errors[err.field] = err.message;
                    });
                    return res.status(400).render('proverbs/form', {
                        title: 'Create Proverb',
                        proverb: req.body,
                        errors,
                        submitLabel: 'Create',
                        action: '/admin/new',
                    });
                }
                next(error);
            }
        },
        async renderEdit(req, res, next) {
            try {
                const proverb = await proverbService.getProverbById(req.params.id);
                res.render('proverbs/form', {
                    title: 'Edit Proverb',
                    proverb,
                    submitLabel: 'Save Changes',
                    action: `/admin/${req.params.id}/edit`,
                });
            } catch (error) {
                next(error);
            }
        },
        async updateProverb(req, res, next) {
            try {
                const payload = normalizeFormPayload(req.body);
                const validated = await updateProverbValidator.validate(payload);
                await proverbService.updateProverb(req.params.id, validated);
                res.redirect('/admin');
            } catch (error) {
                if (error.messages) {
                    const errors = {};
                    error.messages.forEach((err) => {
                        errors[err.field] = err.message;
                    });
                    return res.status(400).render('proverbs/form', {
                        title: 'Edit Proverb',
                        proverb: { ...req.body, _id: req.params.id },
                        errors,
                        submitLabel: 'Save Changes',
                        action: `/admin/${req.params.id}/edit`,
                    });
                }
                next(error);
            }
        },
        async deleteProverb(req, res, next) {
            try {
                await proverbService.deleteProverb(req.params.id);
                res.redirect('/admin');
            } catch (error) {
                next(error);
            }
        },
        async renderLogin(req, res, next) {
            try {
                res.render('proverbs/login', {
                    title: 'Login',
                    error: null,
                });
            } catch (error) {
                next(error);
            }
        },
        async handleLogin(req, res, next) {
            try {
                const { username, email, password } = req.body;
                const loginIdent = username || email;
                if (!cnf.authApiUrl) {
                    return res.status(500).render('proverbs/login', {
                        title: 'Login',
                        error: 'Authentication API URL is not configured.',
                    });
                }

                const response = await requestJson(cnf.authApiUrl + '/logon', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: { username: loginIdent, email: loginIdent, password },
                    rejectUnauthorized: false,
                });

                if (response.ok) {
                    const data = await response.json();
                    const token = data.data?.token || data.token || data.accessToken || data.data?.accessToken;

                    if (!token) {
                        return res.status(401).render('proverbs/login', {
                            title: 'Login',
                            error: 'Authentication service did not return a token.',
                        });
                    }

                    const decoded = jwt.decode(token) || {};
                    let maxAge = 24 * 60 * 60 * 1000;
                    if (decoded.exp) {
                        maxAge = Math.max(1000, decoded.exp * 1000 - Date.now());
                    }

                    res.cookie('accessToken', token, {
                        httpOnly: true,
                        maxAge,
                    });
                    return res.redirect('/admin');
                } else {
                    const errData = await response.json().catch(() => ({}));
                    return res.status(401).render('proverbs/login', {
                        title: 'Login',
                        error: errData.message || 'Invalid username or password',
                    });
                }
            } catch (error) {
                log.error(error);
                return res.status(500).render('proverbs/login', {
                    title: 'Login',
                    error: `Authentication failed: ${error.message}`,
                });
            }
        },
        async handleLogout(req, res, next) {
            try {
                res.clearCookie('accessToken');
                res.redirect('/');
            } catch (error) {
                next(error);
            }
        },
    };
}