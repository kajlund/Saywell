import express from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';

function toObjectId(idStr) {
    if (typeof idStr !== 'string') idStr = String(idStr || '');
    if (/^[0-9a-fA-F]{24}$/.test(idStr)) {
        return idStr;
    }
    return crypto.createHash('md5').update(idStr).digest('hex').substring(0, 24);
}

import { getWebController } from "./controllers/webController.js";

export function getRouter(cnf, log) {
    const ctrlWeb = getWebController(cnf, log);

    const loadWebUser = (req, res, next) => {
        const token = req.cookies?.accessToken;
        if (token) {
            try {
                const decoded = jwt.verify(token, cnf.jwtSecret);
                if (decoded) {
                    const rawId = decoded.sub || decoded.id || decoded.userId || decoded.email || decoded.username;
                    decoded.id = toObjectId(rawId);
                    req.user = decoded;
                    res.locals.user = decoded;
                }
            } catch (err) {
                log.error(err, 'Token verification failed');
            }
        }
        next();
    };

    const requireWebAuth = (req, res, next) => {
        if (!req.user) {
            return res.redirect('/login');
        }
        next();
    };

    const routeGroups = [
        {
            group: { prefix: '', middleware: [loadWebUser] },
            routes: [
                {
                    method: 'get',
                    path: '/',
                    middleware: [],
                    handler: ctrlWeb.renderHome,
                },
                {
                    method: 'get',
                    path: '/api/random',
                    middleware: [],
                    handler: ctrlWeb.apiRandomProverb,
                },
                {
                    method: 'get',
                    path: '/login',
                    middleware: [],
                    handler: ctrlWeb.renderLogin,
                },
                {
                    method: 'post',
                    path: '/login',
                    middleware: [],
                    handler: ctrlWeb.handleLogin,
                },
                {
                    method: 'get',
                    path: '/logout',
                    middleware: [],
                    handler: ctrlWeb.handleLogout,
                },
            ],
        },
        {
            group: { prefix: '/admin', middleware: [loadWebUser, requireWebAuth] },
            routes: [
                {
                    method: 'get',
                    path: '',
                    middleware: [],
                    handler: ctrlWeb.renderAdminDashboard,
                },
                {
                    method: 'get',
                    path: '/new',
                    middleware: [],
                    handler: ctrlWeb.renderNew,
                },
                {
                    method: 'post',
                    path: '/new',
                    middleware: [],
                    handler: ctrlWeb.createProverb,
                },
                {
                    method: 'get',
                    path: '/:id/edit',
                    middleware: [],
                    handler: ctrlWeb.renderEdit,
                },
                {
                    method: 'post',
                    path: '/:id/edit',
                    middleware: [],
                    handler: ctrlWeb.updateProverb,
                },
                {
                    method: 'post',
                    path: '/:id/delete',
                    middleware: [],
                    handler: ctrlWeb.deleteProverb,
                },
            ],
        },
    ];

    const router = express.Router();

    routeGroups.forEach(({ group, routes }) => {
        routes.forEach(({ method, path, middleware, handler }) => {
            const fullPath = `${group.prefix}${path}`;
            log.info(`Registering route: ${method.toUpperCase()} ${fullPath}`);
            const allMiddleware = [...(group.middleware || []), ...(middleware || [])];
            router[method](fullPath, ...allMiddleware, handler);
        });
    });

    return router;
}
