const extractImage = ($el) => {
  const img = $el.find('img').first();

  const src = img.attr('src');
  const dataSrc = img.attr('data-src');
  const dataLazySrc = img.attr('data-lazy-src');
  const dataOriginal = img.attr('data-original');
  const dataActualSrc = img.attr('data-actualsrc');
  const dataEchoSrc = img.attr('data-echo');
  const dataSrcset = img.attr('data-srcset');
  const srcset = img.attr('srcset');

  if (dataSrc && dataSrc !== src) return dataSrc;
  if (dataLazySrc) return dataLazySrc;
  if (dataOriginal) return dataOriginal;
  if (dataActualSrc) return dataActualSrc;
  if (dataEchoSrc) return dataEchoSrc;

  if (src && !src.includes('data:image') && !src.includes('placeholder')) return src;

  if (srcset || dataSrcset) {
    const sources = (srcset || dataSrcset).split(',');
    if (sources.length > 0) {
      const lastSrc = sources[sources.length - 1].trim().split(' ')[0];
      if (lastSrc && !lastSrc.includes('data:image')) return lastSrc;
    }
  }

  return null;
};

module.exports = { extractImage };
