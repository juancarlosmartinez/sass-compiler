module.exports = {
    entries: [
        {
            baseDir: 'test/fixtures',
        },
        {
            outputConfig: {
                directory: 'test/css'
            },
        },
        {
            baseDir: 'test/fixtures',
            outputConfig: {
                directory: 'test/css'
            },
            filenames: /^[A-Z].+\.(scss|sass)$/,
        },
        {

        }
    ],
}