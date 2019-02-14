// $(document).ready(
//     function(){
//         alert("来了");
//         bar = document.getElementById("sidebar");
//         function closesidebar() {
//             if (bar.style.display == "block"){
//                 toggle = document.getElementsByClassName("sidebar-toggle")[0];
//                 toggle.click();
//             }
//         };
//         document.body.setAttribute("onclick", "closesidebar()");
//         bar.click(
//             function(event){
//                 event.stopPropagation();
//             }
//         )
//     }    
// );
// ############
document.body.setAttribute("onclick", "closesidebar()");
bar = document.getElementById("sidebar");
function closesidebar() {
    if (bar.style.display == "block"){
        toggle = document.getElementsByClassName("sidebar-toggle")[0];
        toggle.click();
    }
};
bar.onclick = function(){

    // function(event){
    //     event.stopPropagation();
    // }
    // 关闭子元素事件
    // window.event.returnValue = false;
    // 关闭当前元素事件
    window.event.cancelBubble = true;
}