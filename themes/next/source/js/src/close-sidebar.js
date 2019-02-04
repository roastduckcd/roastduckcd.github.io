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
    window.event.returnValue = false;
    window.event.cancelBubble = true;
}