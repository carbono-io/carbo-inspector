'use strict';

// Native dependencies
var path        = require('path');
var exec        = require('child_process').exec;
var util        = require('util');

// External dependencies
var gulp        = require('gulp');
var gutil       = require('gulp-util');
var browserSync = require('browser-sync');
var del         = require('del');
var runSequence = require('run-sequence');
var mergeStream = require('merge-stream');

// External dependnecies (browserify stuff)
var browserify  = require('browserify');
var vinylSource = require('vinyl-source-stream');


var lazypipe    = require('lazypipe');
var polyclean   = require('polyclean');

// Load all installed gulp plugins into $
var $           = require('gulp-load-plugins')();

// Read current project data
var BOWER = require('./bower.json');

// Constants
var SRC_DIR     = 'src';
var DIST_DIR    = '.';
var DEMO_DIR    = 'demo';
var TMP_DIR     = 'tmp';

var LESS_DIR = [SRC_DIR + '/**/*.less'];
var CSS_DIR  = [SRC_DIR + '/**/*.css'];
var JS_DIR   = [SRC_DIR + '/**/*.js'];
var HTML_DIR = [SRC_DIR + '/**/*.html', DEMO_DIR + '/**/*.html'];

/**
 * Options for the vulcanize-related tasks
 * @type {Object}
 */
var VULCANIZE_OPTIONS = {

    // Path where tmp files are stored for vulcanization
    baseTmpPath: path.join(TMP_DIR, BOWER.name),

    // Path to the component file
    componentPath: path.join(TMP_DIR, BOWER.name, BOWER.name + '.html'),

    // Path to the component injector file
    injectorPath: path.join(TMP_DIR, BOWER.name, 'injector.html'),
};


/////////////////////
// auxiliary tasks //
/////////////////////

/**
 * Cleans resources
 */
gulp.task('clean', function clean() {
    del.sync(TMP_DIR);
});

/**
 * Prepares components for vulcanization
 */
gulp.task('build-env', ['less', 'javascript'], function () {

    var copySRC = gulp.src(SRC_DIR + '/*')
        .pipe($.rename(function (p) {
            p.dirname = BOWER.name;
        }))
        .pipe(gulp.dest(TMP_DIR));

    var copyBOWER = gulp.src('bower_components/**/*')
        .pipe(gulp.dest(TMP_DIR));

    return mergeStream(copySRC, copyBOWER);
});

/////////////////////
// auxiliary tasks //
/////////////////////


/////////////////
// build tasks //
/////////////////

/**
 * Task for compiling less
 */
gulp.task('less', function less() {

    return gulp.src(LESS_DIR)
        // .pipe($.changed(SRC_DIR, { extension: '.css' }))
        .pipe($.duration('Compiling .less files'))
        .pipe($.less())
        .on('error', $.notify.onError({
            title: 'Less compiling error',
            message: '<%= error.message %>',
            open: 'file:///<%= error.filename %>',
            sound: 'Glass',
            // Basso, Blow, Bottle, Frog, Funk, Glass, Hero,
            // Morse, Ping, Pop, Purr, Sosumi, Submarine, Tink
            icon: path.join(__dirname, 'logo.png'),
        }))
        .pipe($.autoprefixer({
            browsers: [
                'ie >= 10',
                'ie_mob >= 10',
                'ff >= 30',
                'chrome >= 34',
                'safari >= 7',
                'opera >= 23',
                'ios >= 7',
                'android >= 4.4',
                'bb >= 10'
            ],
            cascade: false,
        }))
        .pipe($.polymerizeCss({
            styleId: function (file) {
                return path.basename(file.path, '.css') + '-styles';
            }
        }))
        .pipe($.rename(function (path) {
            path.basename += '-styles';
            path.extname = '.html';
        }))
        // Put files at source dir in order to use them for vulcanization
        .pipe(gulp.dest(SRC_DIR))
        .pipe($.size({ title: 'less' }));
});

/**
 * 
 */
gulp.task('javascript', function () {
    // set up the browserify instance on a task basis
    var b = browserify({
        entries: SRC_DIR + '/carbo-inspector.js',
        debug: true
    });

    return b.bundle()
        .on('error', $.util.log)
        .pipe(vinylSource('carbo-inspector.bundle.js'))
        .pipe(gulp.dest(SRC_DIR));
});

/**
 * Function for vulcanize task
 * We need the temporary directory to run vulcanize
 * as the routes we use in development are virtual
 */
gulp.task('vulcanize:component', ['build-env'], function vulcanize() {

    // Build process for post-vulcanized stuff
    // Taken from polybuild.
    // https://github.com/PolymerLabs/polybuild/blob/master/index.js
    var vulcanizePipe = lazypipe()
        // inline html imports, scripts and css
        // also remove html comments
        .pipe($.vulcanize, {
            excludes: [
                // polymer
                path.join(TMP_DIR, '/polymer/polymer.html'),
                // lodash
                path.join(TMP_DIR, '/lodash/lodash.js')
            ],
            inlineScripts: true,
            inlineCss: true,
            stripComments: true
        })
        // remove whitespace from inline css
        .pipe(polyclean.cleanCss)
        .pipe(polyclean.uglifyJs);


    return gulp.src(VULCANIZE_OPTIONS.componentPath)
        .pipe(vulcanizePipe())
        .pipe(gulp.dest('.'))
        .pipe($.size({title: 'vulcanize' }));
});

/**
 * Adds the injection script to the component
 */
gulp.task('vulcanize:injector', ['build-env'], function () {

    // Build process for post-vulcanized stuff
    // Taken from polybuild.
    // https://github.com/PolymerLabs/polybuild/blob/master/index.js
    var vulcanizePipe = lazypipe()
        // inline html imports, scripts and css
        // also remove html comments
        .pipe($.vulcanize, {
            excludes: [
                // polymer
                path.join(TMP_DIR, '/polymer/polymer.html'),
                // do not exclude lodash, as we are creating a 
                // single bundle here
            ],
            inlineScripts: true,
            inlineCss: true,
            stripComments: true
        })
        // remove whitespace from inline css
        .pipe(polyclean.cleanCss)
        .pipe(polyclean.uglifyJs);

    return gulp.src([VULCANIZE_OPTIONS.componentPath, VULCANIZE_OPTIONS.injectorPath])
        .pipe($.concat('carbo-inspector.injector.html'))
        .pipe(gulp.dest(VULCANIZE_OPTIONS.baseTmpPath))
        .pipe(vulcanizePipe())
        .pipe(gulp.dest('.'))
        .pipe($.size({title: 'vulcanize:injector' }));
});

// Register tasks
gulp.task('distribute', function () {
    runSequence('vulcanize:component', 'vulcanize:injector', 'clean');
});

/////////////////
// build tasks //
/////////////////


///////////////////////
// development tasks //
///////////////////////

/**
 * Serves the application
 */
gulp.task('serve', function () {

    browserSync({
        port: 4000,
        server: {
            baseDir: './',
            index: './demo/src.html',
        },

        routes: {
            '/bower_components': ['/', 'bower_components', 'demo/bower_components']
        },
        serveStatic: ['bower_components'],
        open: true,
        // tunnel: true
    });
});

/**
 * Watches for changes and reloads the browser
 */
gulp.task('watch', function () {

    // Watch LESS files for changes
    gulp.watch(LESS_DIR, ['less']);

    // Watch JS files
    gulp.watch(JS_DIR, ['javascript']);

    // Reload
    var reloadDirs = HTML_DIR
        .concat([
            'carbo-inspector.injector.html',
            SRC_DIR + '/carbo-inspector.bundle.js'
        ]);
    gulp.watch(reloadDirs, browserSync.reload);
});

// Serve & watch
gulp.task('develop', ['less', 'serve', 'watch']);
gulp.task('default', ['develop']);

///////////////////////
// development tasks //
///////////////////////
