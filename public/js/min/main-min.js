$(document).ready(function(){$(".navbar [href^=#]").click(function(t){t.preventDefault();var o=$(this).attr("href");$("html, body").animate({scrollTop:$(o).position().top},"slow")})});