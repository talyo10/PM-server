var gulp            = require('gulp'),
  inject          = require('gulp-inject'),
  clean           = require('gulp-clean'),
  del             = require('del'),
  filter          = require('gulp-filter'),
  htmlmin         = require('gulp-htmlmin'),
  imagemin        = require('gulp-imagemin'),
  useref          = require('gulp-useref'),
  csso            = require('gulp-csso'),
  ngAnnotate      = require('gulp-ng-annotate'),
  uglify          = require('gulp-uglify'),
  rev             = require('gulp-rev'),
  revReplace      = require('gulp-rev-replace'),
  less            = require('gulp-less'),
  concat          = require('gulp-concat-css'),
  minifyCSS       = require('gulp-minify-css'),
  templateCache   = require('gulp-angular-templatecache');

var app = 'assets/',
  dist = 'dist/',
  temp = 'tmp/';

var config = {
  app: app,
  temp: temp,
  assets: app,
  index: app + 'index.html',
  images: app + 'images/**/*',
  htmlTemplates: app + 'views/**/*.html',
  directiveTemplates: app + 'scripts/directives/templates/*.html',
  templateFiles: 'templates*.js',
  optimized: {
    lib: 'lib.js',
    app: 'script.js'
  },
  less: app + 'styles/**/*.less',
  fonts: [
    app + 'bower_components/font-awesome/fonts/**/*',
    app + 'bower_components/bootstrap/dist/fonts/**/*'
  ],
  dist: dist,
  mainModule: 'productionMapConsoleApp',
  js: [
    app + 'scripts/app.js',
    app + 'scripts/**/*.js'
  ],
  jsOrder: [
    app + 'scripts/app.js',
    app + '**/*.js'
  ],
  bower: {
    json: require('./' + app + 'bower.json'),
    directory: app + 'bower_components/',
    ignorePath: '../..'
  },
  libsGraphics: [
    app + 'bower_components/jstree/dist/themes/default/**.{png,gif,jpg}'
  ]
};

gulp.task('less', function(){
  return gulp.src(config.less)
    .pipe(less())
    .pipe(concat('style.css'))
    .pipe(minifyCSS())
    .pipe(gulp.dest(app + 'styles'));
});


gulp.task('build', ['optimize', 'images', 'fonts', 'libs-graphics', 'themify-icons'], function(){
  // clean temp
  del(config.temp);

  return gulp.src(config.dist + 'index.html')
    .pipe(inject(gulp.src(config.dist + 'assets/*.css', {read: false}), {
      name: 'themify',
      ignorePath: config.dist,
      addRootSlash: false
    }))
    .pipe(gulp.dest(config.dist));
});

gulp.task('clean-tmp', function(){
  return gulp.src('./tmp/build')
    .pipe(clean({read: false}));
});

gulp.task('clean', function(){
  return del(config.dist);
});

gulp.task('fonts', ['clean'], function(){
  return gulp.src(config.fonts)
    .pipe(gulp.dest(config.dist + 'assets/fonts/'));
});

gulp.task('themify-icons', ['clean'], function(){
  return gulp.src(
    'bower_components/themify-icons/*.css')
    .pipe(gulp.dest(config.dist + 'assets/'));
});

gulp.task('libs-graphics', function(){
  return gulp.src(config.libsGraphics)
    .pipe(gulp.dest(config.dist + 'assets/styles'));
});

gulp.task('images', ['clean'], function(){
  return gulp
    .src(config.images)
    .pipe(imagemin({optimizationLevel: 4}))
    .pipe(gulp.dest(config.dist + 'images'));
});

gulp.task('clean-templates', function(){
  return del(config.temp);
});

gulp.task('templates', ['clean-templates'], function(){
  return gulp.src(config.htmlTemplates)
    .pipe(htmlmin({collapseWhitespace: true}))
    .pipe(templateCache({module: config.mainModule, root: 'views/'}))
    .pipe(gulp.dest(config.temp));
});

gulp.task('directive-templates', ['clean-templates'], function(){
  return gulp.src(config.directiveTemplates)
    .pipe(htmlmin({collapseWhitespace: true}))
    .pipe(templateCache('templates-directive.js', {module: config.mainModule, root: 'scripts/directives/templates/'}))
    .pipe(gulp.dest(config.temp));
});

gulp.task('optimize', ['inject', 'templates', 'directive-templates', 'clean'], function(){
  var cssFilter = filter(app + '**/*.css', {restore: true});
  var jsAppFilter = filter(app + '**/' + config.optimized.app, {restore: true});
  var jslibFilter = filter(app + '**/' + config.optimized.lib, {restore: true});
  var revFilter = filter([app + '**/*.js', app + '**/*.css'], {restore: true});

  var templates = gulp.src(config.temp + config.templateFiles, {read: false});
  return gulp
    .src(config.index)
    // inject templates
    .pipe(inject(templates, {name: 'templates', relative: true}))
    .pipe(useref())
    // Get the css
    .pipe(cssFilter)
    .pipe(csso())
    .pipe(cssFilter.restore)
    // Get the custom javascript
    .pipe(jsAppFilter)
    .pipe(ngAnnotate({add: true}))
    .pipe(uglify())
    .pipe(jsAppFilter.restore)
    // Get the vendor javascript
    .pipe(jslibFilter)
    .pipe(uglify()) // another option is to override wiredep to use min files
    .pipe(jslibFilter.restore)
    .pipe(revFilter)
    // Take inventory of the file names for future rev numbers
    .pipe(rev())
    .pipe(revFilter.restore)
    .pipe(revReplace())
    .pipe(gulp.dest(config.dist));
});

gulp.task('inject', function(){
  var js = gulp.src(config.js, {read: false});

  return gulp.src(config.index)
    .pipe(inject(js, {relative: true}))
    .pipe(gulp.dest(config.app));
});
