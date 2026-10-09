// Keep independently cacheable client modules below Vite's default warning
// threshold. This does not change the warning limit or the server bundle.
export const clientChunks = {
  output: {
    strictExecutionOrder: true,
    codeSplitting: {
      minSize: 20_000,
      groups: [
        {name: 'vendor', test: /[\\/]node_modules[\\/]/, maxSize: 350_000, priority: 20},
        {name: 'game', test: /[\\/](?:lib|components)[\\/]game[\\/]/, maxSize: 350_000, priority: 10},
      ],
    },
  },
};
