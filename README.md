# Descargas IOT2040 (Example Image V3.1.1, kernel 4.4.302-cip69-st5)

Este repositorio no incluye código fuente. El objetivo de este archivo es
concentrar los enlaces oficiales disponibles para obtener los módulos de kernel
de la IOT2040 (UVC) para la imagen **V3.1.1** con kernel
**4.4.302-cip69-st5**.

## Paquetes UVC requeridos

- `kernel-module-uvcvideo`
- `kernel-module-videobuf2-v4l2`
- `kernel-module-videodev`
- `kernel-module-videobuf2-core`

## Enlaces oficiales encontrados

1. **Repositorio oficial (fuentes Yocto, tag V3.1.1)**  
   Siemens no publica `.ipk` precompilados en GitHub; el repositorio solo
   contiene las recetas Yocto para generar los paquetes. Descargas directas
   del código fuente:
   - Tag V3.1.1 (releases): https://github.com/siemens/meta-iot2000/releases/tag/V3.1.1
   - Fuente (zip): https://github.com/siemens/meta-iot2000/archive/refs/tags/V3.1.1.zip
   - Fuente (tar.gz): https://github.com/siemens/meta-iot2000/archive/refs/tags/V3.1.1.tar.gz

2. **Siemens Industry Online Support (SIOS)**  
   Los binarios oficiales (Example Image y paquetes asociados) se publican en
   el portal de descargas de Siemens. Desde allí se obtiene la imagen V3.1.1 y
   el paquete **kernel-modules** completo que contiene los `.ipk` anteriores.
   - Descargas oficiales SIMATIC IOT20x0 (ID 109741799):  
     https://support.industry.siemens.com/cs/document/109741799/downloads-for-simatic-iot20x0?lc=en-ww

## Nota sobre los `.ipk` individuales

En el repositorio `meta-iot2000` no hay binarios `.ipk`. Si necesitas los
paquetes exactos para `4.4.302-cip69-st5`, la vía oficial es descargar el
**kernel-modules** desde SIOS o reconstruirlos con Yocto (`bitbake
kernel-module-uvcvideo`, etc.) usando el tag V3.1.1.
