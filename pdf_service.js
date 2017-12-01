function PDF_JS(initobj){
  var initobj=initobj||{}
  var obj={
    containerId:'the-canvas'
  }
  for(var key in initobj){
    obj[key]=initobj[key]
  }
  this.pdfDoc=null;  //下载到的整体后的pdf
  this.pageNum=1; //当前页码
  this.scale=1;//缩放比率
  this.totalPage=null;
  this.pageNumPending=null;
  this.canvas = document.getElementById(obj.containerId);
  this.ctx = this.canvas.getContext('2d');
  this.downloading=true; //PDF下载中标识
  this.pageRendering=false; //单页pdf解析标识
  this.pdfName=null;//当前PDF名称
  this.cache={};
  this.init();
}
PDF_JS.prototype={
  init:function(){
    var that=this
    console.log('引入PDF_JS成功')
  },
  render:function(url,callback){
    var that=this
    that.rendercallback=callback
    that.downloading=true
    that.pdfName=that.getPdfName(url)
    if(that.rendercallback&&that.rendercallback.cache){
      that.cache=that.rendercallback.cache()
      //that.cache.PDF=that.localGet()
    }
    that.rendercallback&&that.rendercallback.downloading&&that.rendercallback.downloading({
      downloading:that.downloading
    })

    function pdfDoc(pdfDoc_){
      that.pdfDoc = pdfDoc_;
      that.downloading=false;
      that.rendercallback&&that.rendercallback.downloading&&that.rendercallback.downloadingSuccess({
        downloading:that.downloading
      })
      console.log('当前文档',that.pdfDoc)
      that.totalPage=that.pdfDoc.numPages
      that.renderPage(that.pageNum);
    }

    if(that.cache.PDF&&that.cache.PDF[that.pdfName]){
      console.log('缓存中加载')
      return pdfDoc(that.cache.PDF[that.pdfName])
    }else{
      PDFJS.getDocument(url).then(function(pdfDoc_) {
        console.log('首次加载')
        that.cache.PDF=that.cache.PDF||{}
        that.cache.PDF[that.pdfName]=pdfDoc_//CircularJSON.parse(CircularJSON.stringify(pdfDoc_))
        //that.localSet(that.cache.PDF)
        pdfDoc(that.cache.PDF[that.pdfName])
      });
    }
  },
  renderPage:function(num){  //解析并渲染单页
    var that=this
    that.pageRendering = true;  //单页渲染中
    that.rendercallback&&that.rendercallback.pageRendering&&that.rendercallback.pageRendering({
      pageNum:num,
      pageRendering:that.pageRendering
    })

    function getPage(page){
      var viewport = page.getViewport(that.scale);
      that.canvas.height = viewport.height;
      that.canvas.width = viewport.width;
      var renderContext = {
        canvasContext: that.ctx,
        viewport: viewport
      };
      var renderTask = page.render(renderContext);
      renderTask.promise.then(function() {
        that.pageRendering = false;
        that.rendercallback&&that.rendercallback.pageRenderingSuccess&&that.rendercallback.pageRenderingSuccess({
          pageNum:num,
          totalPage:that.totalPage,
          pageRendering:that.pageRendering
        })
        if (that.pageNumPending !== null) {
          that.renderPage(that.pageNumPending);
          that.pageNumPending = null;
        }
      });
    }

    setTimeout(function(){   //如果不用这个，rendercallback.loadding无法及时执行
      that.pdfDoc.getPage(num).then(function(page) {
        getPage(page)
      });
    },100)
  },
  queueRenderPage:function(num){
    var that=this;
    if (that.pageRendering) {
      that.pageNumPending = num;
    } else {
      that.renderPage(num);
    }
  },
  onNextPage:function(){
    var that=this;
    if (that.pageNum >= that.pdfDoc.numPages) {
      return;
    }
    that.pageNum++;
    that.queueRenderPage(that.pageNum);
  },
  onPrevPage:function () {
    var that=this
    if (that.pageNum <= 1) {
      return;
    }
    that.pageNum--;
    that.queueRenderPage(that.pageNum);
  },
  getPdfName:function(url){
    var p=/([a-zA-Z0-9]*)\.(pdf)/gi
    var m=p.exec(url)
    return m[2]+m[1]
  },
  localSet:function(obj,name){
    var name=name||'PDF'
    localStorage.setItem(name,JSON.stringify(obj))
  },
  localGet:function(name){
    var name=name||'PDF'
    return localStorage[name]&&(JSON.parse(localStorage.getItem(name)))
  },
  time:function(){
    console.log('当前秒钟',(new Date()).getSeconds())
  }
}