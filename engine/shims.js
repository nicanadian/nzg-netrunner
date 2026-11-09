/* DOM-free boundaries for the unmodified GPL-3.0 Chiriboga engine. */
var nativeStringify = JSON.stringify;
var cardSet = [],
  setIdentifiers = [],
  accessibilityMode = "text";
var window = globalThis;
var location = { search: "" };
var document = { getElementById: () => null };
var $ = function () {
  return new Proxy(
    {},
    {
      get: (_, key) =>
        key === "length"
          ? 0
          : (...args) => (key === "html" && !args.length ? "" : $()),
    },
  );
};
var jQuery = {
  extend(deep, target, source) {
    function copy(value) {
      if (Array.isArray(value)) return value.map(copy);
      if (value && typeof value === "object") {
        const out = {};
        for (const key of Object.keys(value)) out[key] = copy(value[key]);
        return out;
      }
      return value;
    }
    return Object.assign(target, copy(source));
  },
};
// init.js's only interval is a DOM thinking animation.
var setInterval = () => 0;
var particleSystems = { breaksubroutine: { spawnRect: {} } };
