import { module, test } from 'qunit';
import {
  setup,
  visit /* mockServer */,
} from 'ember-cli-fastboot-testing/test-support';
import { dependencySatisfies } from '@embroider/macros';

// FastBoot does not not suppport Ember 5 yet :-(
(dependencySatisfies('ember-source', '>= 5') ? module.skip : module)(
  'FastBoot | image',
  function (hooks) {
    setup(hooks);

    test('it renders an image', async function (assert) {
      await visit('/image');

      assert.dom('img[data-test-simple-image]').exists();
      assert
        .dom('img[data-test-simple-image]')
        .hasAttribute(
          'src',
          new RegExp('/assets/images/tests/test640w(-\\w+)?.png')
        );
    });

    test('it renders lqip color', async function (assert) {
      await visit('/image');

      assert.dom('img[data-test-lqip-image=color]').exists();
      assert
        .dom('img[data-test-lqip-image=color]')
        .hasStyle({ 'background-color': 'rgb(88, 72, 56)' });
    });

    test('it renders lqip inline', async function (assert) {
      await visit('/image');

      assert.dom('img[data-test-lqip-image=inline]').exists();
      assert
        .dom('img[data-test-lqip-image=inline]')
        .hasStyle({ 'background-size': 'cover' });
      assert.ok(
        window
          .getComputedStyle(
            document.querySelector('img[data-test-lqip-image=inline]')
          )
          .backgroundImage?.match(/data:image\/svg/),
        'it has a background SVG'
      );
    });

    test('it renders lqip blurhash', async function (assert) {
      await visit('/image');

      // this is called automatically in a real page, but ember-feastboot-testing does not evaluate our blurhash script,
      // so we need to call it explicitly in our test.
      window.__eri_blurhash.applySSR();

      assert.dom('img[data-test-lqip-image=blurhash]').exists();
      assert
        .dom('img[data-test-lqip-image=blurhash]')
        .hasStyle({ 'background-size': 'cover' });
      assert.ok(
        window
          .getComputedStyle(
            document.querySelector('img[data-test-lqip-image=blurhash]')
          )
          .backgroundImage?.match(/data:image\/png/),
        'it has a background PNG'
      );
    });
  }
);
