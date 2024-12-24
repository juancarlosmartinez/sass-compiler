module.exports = {
    entries: [
        {
            baseDir: 'test/fixtures',
        },
        {
            outputDir: 'test/css',
        },
        {
            baseDir: 'test/fixtures',
            outputDir: 'test/css',
            filenames: /^[A-Z].+\.(scss|sass)$/,
        },
        {

        }
    ],
}