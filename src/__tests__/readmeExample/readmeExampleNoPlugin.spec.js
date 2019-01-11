import rest from './store/modules/rest';
import app from './store/modules/app';

describe('rest no plugin', () => {
  it('should have getters', () => {
    expect(rest.getters.$appVersion()).toBe('');
    expect(rest.getters.baseRestUrl({}, { $appVersion: '0.0' }))
      .toBe('/api/0.0');
  });
});

describe('app no plugin', () => {
  it('should have getters', () => {
    expect(app.getters.version()).toBe('0.1');
  });
});
