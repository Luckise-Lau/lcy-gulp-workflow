const { src, dest, parallel, series, watch } = require('gulp')
const loadPlugins = require('gulp-load-plugins')
const plugins = loadPlugins()

const del = require('del')

const sass = require('gulp-sass')(require('node-sass'))
const browserSync = require('browser-sync')

// 获取项目的配置文件
const cwd = process.cwd()
let config = {
  build: {
    src: 'src',
    temp: 'temp',
    dist: 'dist',
    public: 'public',
    paths: {
      styles: 'assets/styles/*.scss',
      scripts: 'asstest/scripts/*.js',
      pages: '*.html',
      images: 'asstest/images/**',
      fonts: 'asstest/fonts/**',
      publics: '**'
    }
  }
}
try {
  const loadConfig = require(`${ cwd }/project.config.js`)
  config = Object.assign({}, config, loadConfig)
} catch (err) {}

// 创建 styleBuild 构建任务
const styleBuild = () => {
  return src(config.build.paths.styles, {
    base: config.build.src,
    cwd: config.build.src
  })
  .pipe(sass({
    outputStyle: 'expanded'
  }))
  .pipe(dest(config.build.temp))
}

// 创建 scriptBuild 构建任务
const scriptBuild = () => {
  return src(config.build.paths.scripts, { 
    base: config.build.src,
    cwd: config.build.src
  })
  .pipe(plugins.babel({
    presets: [require('@babel/preset-env')]
  }))
  .pipe(dest(config.build.temp))
}

// 创建 pageBuild 构建任务
const pageBuild = () => {
  return src(config.build.paths.pages, { 
    base: config.build.src,
    cwd: config.build.src 
  })
  .pipe(plugins.swig({
    data: config.data,
    defaults: {
      cache: false
    }
  }))
  .pipe(dest(config.build.temp))
}

// 创建图片构建任务
const imgBuild = () => {
  return src(config.build.paths.images, {
    base: config.build.src,
    cwd: config.build.src
  })
  .pipe(plugins.imagemin())
  .pipe(dest(config.build.dist))
}

// 创建 fontBuild 构建任务
const fontBuild = () => {
  return src(config.build.paths.fonts, {
    base: config.build.src,
    cwd: config.build.src
  })
  .pipe(plugins.imagemin())
  .pipe(dest(config.build.dist))
}

// 创建 extraBuild 任务
const extraBuild = () => {
  return src(config.build.paths.publics, {
    base: config.build.public,
    cwd: config.build.public
  })
  .pipe(plugins.imagemin())
  .pipe(dest(config.build.dist))
}

// 创建 clean 任务
const clean = () => {
  return del([config.build.dist, config.build.temp])
}

// 创建 server 服务任务
const bs = browserSync.create()
const server = () => {
  // 添加 watch监听
  watch(config.build.paths.styles, {
    cwd: config.build.src
  }, styleBuild)
  watch(config.build.paths.scripts, {
    cwd: config.build.src
  }, scriptBuild)
  watch(config.build.paths.pages, {
    cwd: config.build.src
  }, pageBuild)
  watch([
    config.build.paths.images,
    config.build.paths.fonts
  ], {
    cwd: config.build.src
  }, bs.reload)
  watch(config.build.paths.publics, {
    cwd: config.build.public
  }, bs.reload)

  // 启动 server 服务
  bs.init({
    server: {
      baseDir: [config.build.temp, config.build.src, config.build.public],
      routes: {
        '/node_modules': './node_modules'
      }
    },
    notify: false,
    port: 2080,
    files: [`${ config.build.temp }/**`]
  })
}

// 创建 userefBuild 构建任务
const userefBuild = () => {
  return src(config.build.paths.pages, {
    base: config.build.temp,
    cwd: config.build.temp
  })
  .pipe(plugins.useref({ searchPath: [config.build.temp, '.']  }))
  // 压缩代码
  .pipe(plugins.if(/\.js$/, plugins.uglify()))
  .pipe(plugins.if(/\.css$/, plugins.cleanCss()))
  .pipe(plugins.if(/\.html$/, plugins.htmlmin({
    collapseWhitespace: true,
    minifyCSS: true,
    minifyJS: true
  })))
  .pipe(dest('dist'))
}

// 创建 compile 构建任务
const compile = parallel(styleBuild, scriptBuild, pageBuild)

// 创建 build 构建任务
const build = series(clean, parallel(
  series(compile, userefBuild),
  extraBuild, imgBuild, fontBuild
))

// 创建 develop 构建任务
const develop = series(compile, server)

// 导出构建任务
module.exports = {
  clean,
  compile,
  build,
  develop
}