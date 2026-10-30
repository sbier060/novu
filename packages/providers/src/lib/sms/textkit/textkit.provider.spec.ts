import { afterEach, expect, test, vi } from 'vitest';
import { axiosSpy } from '../../../utils/test/spy-axios';
import { TextKitSmsProvider } from './textkit.provider';

const config = { apiKey: 'ssms_sk_test_key', from: '+15005550100' };
const message = { to: '+15005550006', content: 'Your order has shipped' };
const headers = { Authorization: 'Bearer ssms_sk_test_key', 'Content-Type': 'application/json' };

afterEach(() => {
  vi.restoreAllMocks();
});

test('should trigger textkit correctly', async () => {
  const { mockPost } = axiosSpy({
    data: { id: 'msg_a1B2c3D4e5F6g7H8', created_at: '2026-10-30T12:00:00.000Z' },
  });

  const response = await new TextKitSmsProvider(config).sendMessage(message);

  expect(mockPost).toHaveBeenCalledWith(
    'https://api.jointextkit.com/v1/messages',
    { to: '+15005550006', from: '+15005550100', body: 'Your order has shipped' },
    { headers }
  );
  expect(response).toEqual({ id: 'msg_a1B2c3D4e5F6g7H8', date: '2026-10-30T12:00:00.000Z' });
});

test('should prefer the from set on the message over the integration default', async () => {
  const { mockPost } = axiosSpy({ data: { id: 'msg_1', created_at: '2026-10-30T12:00:00.000Z' } });

  await new TextKitSmsProvider(config).sendMessage({ ...message, from: '+15005550101' });

  expect(mockPost.mock.calls[0][1].from).toBe('+15005550101');
});

test('should leave from out when none is configured', async () => {
  const { mockPost } = axiosSpy({ data: { id: 'msg_1', created_at: '2026-10-30T12:00:00.000Z' } });

  await new TextKitSmsProvider({ apiKey: config.apiKey }).sendMessage(message);

  expect(JSON.parse(JSON.stringify(mockPost.mock.calls[0][1]))).toEqual({
    to: '+15005550006',
    body: 'Your order has shipped',
  });
});

test('should fall back to the current time for a response with no created_at', async () => {
  // A message held for quiet hours answers with a scheduled_message, which has no created_at.
  axiosSpy({ data: { id: 'job_1759400000000a1B2c3D4e5' } });

  const response = await new TextKitSmsProvider(config).sendMessage(message);

  expect(response.id).toBe('job_1759400000000a1B2c3D4e5');
  expect(Number.isNaN(Date.parse(response.date as string))).toBe(false);
});

test('should merge bridge provider data over the request', async () => {
  const { mockPost } = axiosSpy({ data: { id: 'msg_1', created_at: '2026-10-30T12:00:00.000Z' } });

  await new TextKitSmsProvider(config).sendMessage(message, {
    _passthrough: {
      body: { to: '+15005550007', tags: ['welcome'] },
      headers: { 'Idempotency-Key': 'order-1' },
    },
  });

  expect(mockPost).toHaveBeenCalledWith(
    'https://api.jointextkit.com/v1/messages',
    { to: '+15005550007', from: '+15005550100', body: 'Your order has shipped', tags: ['welcome'] },
    { headers: { ...headers, 'Idempotency-Key': 'order-1' } }
  );
});
