import { defineManifest } from '@crxjs/vite-plugin'
import pkg from './package.json'

export default defineManifest({
  manifest_version: 3,
  name: pkg.name,
  version: pkg.version,
  icons: {
    16: 'public/browsem_logo_16.png',
    32: 'public/browsem_logo_32.png',
    48: 'public/browsem_logo_48.png',
    128: 'public/browsem_logo_128.png'
  },
  action: {
    default_icon: {
        16: 'public/browsem_logo_16.png',
        32: 'public/browsem_logo_32.png',
        48: 'public/browsem_logo_48.png',
        128: 'public/browsem_logo_128.png'
    },
    default_popup: 'src/popup/index.html',
  },
  permissions: [
    'contentSettings',
    'storage',
    'tabs',
    'webNavigation',
    'offscreen'
  ],
  host_permissions: ["<all_urls>"],
  content_scripts: [{
    js: ['src/content/main.tsx'],
    matches: ['<all_urls>'],
  }],
  background: {
    "service_worker": "src/background.ts",
    "type": "module"
  },
  web_accessible_resources: [
      {
          "resources": ["src/assets/*"],
          "matches": ["<all_urls>"]
      }
  ]
})
