var dArrow = document.querySelector('#down-arrow')
var philosopherReis = document.querySelector("#reis1")
dArrow.addEventListener("click", function(){
	window.scrollBy(0, window.innerHeight);

	if($(window).width() / $(window).height() > 800/1080){
		var goal = $(philosopherReis).css("margin-top");
		var ygoal = parseFloat(goal.slice(0,-1));
		philosopherReis.style.marginTop = philosopherReis.style.marginTop + $(window).height() + "px";
		var time = {
		changePercent:3.5,
		reis : philosopherReis,
		goal: ygoal,
		changeNext: false
		};
		setTimeout(timeFunc, 1000/60, time)
	}
})

function timeFunc(time){
	if(time.changeNext === true){
		time.reis.style.marginTop = time.goal + "px";
		time.reis.removeAttribute("style");
		return;
	}
	time.reis.style.marginTop = (parseFloat(time.reis.style.marginTop) - (time.changePercent * $(window).height() / 100)) + "px";
	if(parseFloat(time.reis.style.marginTop) - (time.changePercent * $(window).height() / 100) <= time.goal){
		time.changeNext = true;
	}
	setTimeout(timeFunc, 1000/60, time)
}
