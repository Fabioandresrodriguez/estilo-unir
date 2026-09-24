import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Clóset Digital',
    short_name: 'Clóset',
    description: 'Digitaliza tu guardarropa con estilo RawBlock Brutalista',
    start_url: '/',
    display: 'standalone',
    background_color: '#FFFFFF',
    theme_color: '#000000',
    icons: [
      {
        src: '/icons/estilo-icon_16x16.ico',
        sizes: '16x16',
        type: 'image/x-icon',
      },
      {
        src: '/icons/estilo-icon_32x32.ico',
        sizes: '32x32',
        type: 'image/x-icon',
      },
      {
        src: '/icons/estilo-icon_48x48.ico',
        sizes: '48x48',
        type: 'image/x-icon',
      },
      {
        src: '/icons/estilo-icon_64x64.ico',
        sizes: '64x64',
        type: 'image/x-icon',
      },
      {
        src: '/icons/estilo-icon_128x128.ico',
        sizes: '128x128',
        type: 'image/x-icon',
      },
      {
        src: '/icons/estilo-icon_256x256.ico',
        sizes: '256x256',
        type: 'image/x-icon',
      },
    ],
  };
}
