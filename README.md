# PDF.js
pdf_service封装了pdf.js,移动PC端均可解析pdf。lib中的三个文件为依赖库，（依赖顺序为compatibility.js,pdf.js,pdf.worker.js）。本次编写的项目是一个老的angular1项目，构建工具为gulp，采用es3语法。


功能做了内存缓存，但本地缓存未实现，原因是解析出的_pdfDoc是一个循环对象，localStorage存储前JSON.stringify报无法序列化循环对象，虽然采用了其他的库（cycle.js等）能解决这个问题，但是更改后的_pdfDoc失去了getPage这个方法...

![vvv](http://p09oq805j.bkt.clouddn.com/image/pdf.gif)

注意遇到的跨域问题，服务器设置accss-control-allow-origin
![vvv](http://p09oq805j.bkt.clouddn.com/image/pdf%E8%B7%A8%E5%9F%9F.png)


html可仍以书写，注意需要传入canvas的id
```html
<div class="icx-pager icx-pager-inedia-heartData inedia-text" ng-controller="inediaHeartDataController">
    <div class="header" ng-show="uiState.pdfDoc">
        <span>Page: <span id="page_num">{{uiState.pageNum}}</span> / <span id="page_count">{{uiState.totalPage}}</span></span>
    </div>
    <div class="prevnext" ng-show="uiState.pdfDoc">
        <button id="prev">&#8249;</button>
        <button id="next">&#8250;</button>
    </div>
    <div id="pdfcontainer">
        <canvas id="the-canvas"></canvas>
    </div>
    <div class="overlay" ng-show="uiState.state">
        <div id="content">{{uiState.state}}</div>
    </div>
</div>
```

具体使用，js中实例化一个pdf,render传入url,及一个包含了下载中，下载完成，解析单页中，解析完成四个回调，以及一个全局缓存对象

```javascript
angular.module("icarbonx").controller("inediaHeartDataController",["$rootScope","$scope","$stateParams","footMenuCreator","inediaService","servic_inedia_postJson","$rootScope",'$filter',function($rootScope,$scope,$stateParams,footMenuCreator,inediaService,servic_inedia_postJson,$rootScope,$filter){
  // var url = '//cdn.mozilla.net/pdfjs/tracemonkey.pdf';
  // var url='https://cdn.shopify.com/s/files/1/1545/3617/files/SH01_User_Manaul.pdf'
  $scope.uiState={
    state:true,
    pdfDoc:false,
    pageNum:null,
    totalPage:null
  }
  var url=$stateParams.pdf
  var pdf=new PDF_JS()
  pdf.render(url,{
    downloading:function(result){
      if(result.downloading) $scope.uiState.state='下载PDF中......'
      if(!$scope.$$phase) {
        $scope.$apply();
      }
    },
    downloadingSuccess:function(result){
      $scope.uiState.pdfDoc=true
      if(!result.downloading) $scope.uiState.state=false
      if(!$scope.$$phase) {
        $scope.$apply();
      }
    },
    pageRendering:function(result){
      console.log('ahahah')
      var message='正在解析第'+result.pageNum+'页'
      if(result.pageRendering) $scope.uiState.state=message
      console.log($scope.uiState.state)
      if(!$scope.$$phase) {
        $scope.$apply();
      }
    },
    pageRenderingSuccess:function(result){
      if(!result.pageRendering) $scope.uiState.state=false
      console.log($scope.uiState.state)
      $scope.uiState.pageNum = result.pageNum;
      $scope.uiState.totalPage = result.totalPage;

      if(!$scope.$$phase) {
        $scope.$apply();

      }
    },
    cache:function(){
      return $rootScope
    }
  })
 
  document.getElementById('next').addEventListener('click', function(){
    pdf.onNextPage()
  });
  document.getElementById('prev').addEventListener('click', function(){
    pdf.onPrevPage()
  });
  $scope.$emit('showFootMenu', footMenuCreator.createBlankMenu(), $scope);
}])


```
