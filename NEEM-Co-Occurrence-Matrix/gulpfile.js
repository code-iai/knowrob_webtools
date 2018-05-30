const SRC_ROOT = './src';
const DEBUG_ROOT = './debug';
const BUILD_ROOT = './build';

const gulp = require('gulp');
const sass = require('gulp-sass');
const cleanCSS = require('gulp-clean-css');
const browserify = require('browserify');
const source = require('vinyl-source-stream');
const buffer = require('vinyl-buffer');
const log = require('gulplog');
const uglify = require('gulp-uglify');
const sourcemaps = require('gulp-sourcemaps');
const reactify = require('reactify');
const babel = require('gulp-babel');

gulp.task('default', function() {
    buildCSSMain(SRC_ROOT, BUILD_ROOT);
    buildJSMain(SRC_ROOT+'/js/neemCoOccurrenceMatrix.js', 'neemCoOccurrenceMatrix.js', BUILD_ROOT, true,true);
    moveIndexHTML(BUILD_ROOT);
});

gulp.task('debug', function () {
    buildCSSMain(SRC_ROOT, DEBUG_ROOT);
    buildJSMain(SRC_ROOT+'/js/neemCoOccurrenceMatrix.js', 'neemCoOccurrenceMatrix.js', DEBUG_ROOT, true,false);
    moveIndexHTML(DEBUG_ROOT);
});

function buildCSSMain(src, dest){
    gulp.src(src+'/styles/neemCoOccurrenceMatrix.scss')
        .pipe(sass())
        .pipe(cleanCSS({compatibility: 'ie8'}))
        .pipe(gulp.dest(dest));
}

function buildJSMain(pathToSrcMainJs, outputName, dest, useBabel, useUglify) {
    let b = resolveJSRequireDependencies(pathToSrcMainJs, outputName);

    if(useBabel){
        b = b.pipe(babel({
            presets: ['env']
        }));
    }

    if(useUglify){
        b = b.pipe(uglify());
    }

    b.on('error', log.error)
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest(dest));
}

function resolveJSRequireDependencies(pathToMainJs, outputName){
    let b = browserify({
        entries: pathToMainJs,
        debug: true,
        // defining transforms here will avoid crashing your stream
        transform: [reactify]
    });
    b.external('d3');
    b.external('jquery');
    b.external('rdflib');

    return b.bundle()
        .pipe(source(outputName))
        .pipe(buffer())
        .pipe(sourcemaps.init({loadMaps: true}));
}

function moveIndexHTML(dest){
    gulp.src('src/index.html')
        .pipe(gulp.dest(dest));
}