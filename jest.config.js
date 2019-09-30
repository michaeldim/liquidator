module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    setupFiles: ['dotenv-flow/config'],
    globals: {
        'ts-jest': {
            diagnostics: false,
        },
    },
};
