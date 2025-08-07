import '@testing-library/jest-dom';

// Mock ResizeObserver for tests involving recharts or responsive components
class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

global.ResizeObserver = ResizeObserver;
