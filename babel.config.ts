module.exports = function(api : any) {
    api.cache(true);
    return {
      presets: ['babel-preset-expo'],
      plugins: [
        // Cần thiết cho expo-router v2
        require.resolve("expo-router/babel"),
      ],
    };
  };
  