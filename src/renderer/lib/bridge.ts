import type { ElectronAPI } from '../../preload';

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export const bridge: ElectronAPI = window.electronAPI;
