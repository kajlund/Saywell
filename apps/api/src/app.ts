import { randomUUID } from 'node:crypto';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serveStatic } from '@hono/node-server/serve-static';
import { zValidator } from '@hono/zod-validator';
import type { Logger } from 'pino';
import {
  createProverbSchema,
  objectIdSchema,
  proverbListQuerySchema,
  randomProverbQuerySchema,
  proverbSearchQuerySchema,
  updateProverbSchema,
} from '@proverbs/contracts';
import { DomainError } from './errors/domain-error.js';
import { ProverbService } from './services/proverb-service.js';

type Variables = { requestId: string };

const validation = (result: { success: boolean; error?: unknown }, c: any) =>
  result.success
    ? undefined
    : c.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Request validation failed',
            details: result.error,
            requestId: c.get('requestId'),
          },
        },
        400,
      );

export function createApp(
  service: ProverbService,
  logger: Logger,
  webOrigin = 'http://localhost:5173',
  serveWeb = true,
) {
  const app = new Hono<{ Variables: Variables }>();

  app.use('*', cors({ origin: webOrigin }));
  app.use('*', async (c, next) => {
    const requestId = c.req.header('x-request-id') ?? randomUUID();
    c.set('requestId', requestId);
    c.header('x-request-id', requestId);
    const started = Date.now();
    await next();
    logger.info(
      {
        requestId,
        method: c.req.method,
        path: c.req.path,
        status: c.res.status,
        durationMs: Date.now() - started,
      },
      'request',
    );
  });

  const id = (c: any) => {
    const parsed = objectIdSchema.safeParse(c.req.param('id'));
    if (!parsed.success) throw new DomainError('INVALID_ID', 'Invalid ID format', 400);
    return parsed.data;
  };

  app.get('/health', (c) => c.json({ status: 'OK', message: 'Saywell API is running' }));

  app.get(
    '/api/proverbs/search',
    zValidator('query', proverbSearchQuerySchema, validation),
    async (c) => {
      const result = await service.searchProverbs(c.req.valid('query'));
      return c.json({
        success: true,
        data: result.proverbs,
        meta: { query: result.query, count: result.proverbs.length, pagination: result.pagination },
      });
    },
  );

  app.get('/api/proverbs', zValidator('query', proverbListQuerySchema, validation), async (c) => {
    const result = await service.getProverbs(c.req.valid('query'));
    return c.json({
      success: true,
      data: result.proverbs,
      meta: { count: result.proverbs.length, pagination: result.pagination },
    });
  });

  app.get('/api/proverbs/filters', async (c) =>
    c.json({ success: true, data: await service.getFilterOptions() }),
  );

  app.get('/api/random', zValidator('query', randomProverbQuerySchema, validation), async (c) => {
    const proverb = await service.getRandomProverb(c.req.valid('query'));
    return c.json({ success: true, proverb });
  });

  app.post('/api/proverbs', zValidator('json', createProverbSchema, validation), async (c) =>
    c.json({ success: true, data: await service.createProverb(c.req.valid('json')) }, 201),
  );

  app.get('/api/proverbs/:id', async (c) =>
    c.json({ success: true, data: await service.getProverbById(id(c)) }),
  );

  app.put('/api/proverbs/:id', zValidator('json', updateProverbSchema, validation), async (c) =>
    c.json({ success: true, data: await service.updateProverb(id(c), c.req.valid('json')) }),
  );

  app.delete('/api/proverbs/:id', async (c) => {
    await service.deleteProverb(id(c));
    return c.json({ success: true, message: 'Proverb successfully deleted', data: {} });
  });

  app.all('/api/*', (c) =>
    c.json(
      {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Route not found', requestId: c.get('requestId') },
      },
      404,
    ),
  );

  if (serveWeb) {
    app.use('/*', serveStatic({ root: '../web/dist' }));
    app.get('*', serveStatic({ root: '../web/dist', path: 'index.html' }));
  }

  app.onError((error, c) => {
    const requestId = c.get('requestId') ?? randomUUID();
    if (error instanceof DomainError) {
      return c.json(
        {
          success: false,
          error: { code: error.code, message: error.message, details: error.details, requestId },
        },
        error.status,
      );
    }

    logger.error({ err: error, requestId }, 'unhandled error');
    return c.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred', requestId },
      },
      500,
    );
  });

  return app;
}
