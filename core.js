(function(){

    function l(what) { return document.getElementById(what); }
    
    function Beautify(what, floats) { // turns 9999999 into 9,999,999 – by Orteil => http://orteil.dashnet.org/
        var str = "";
        what = Math.round(what * 100000) / 100000; // get rid of weird rounding errors
        if (floats > 0) {
            var floater = what - Math.floor(what);
            floater = Math.round(floater * 100000) / 100000; // get rid of weird rounding errors
            var floatPresent = floater ? 1 : 0;
            floater = (floater.toString() + "0000000").slice(2, 2 + floats); // yes this is hacky (but it works)
            str = Beautify(Math.floor(what)) + (floatPresent ? ("." + floater) : "");
        } else {
            what = Math.floor(what);
            what = (what + "").split("").reverse();
            for (var i in what) {
                if (i % 3 == 0 && i > 0) str="," + str;
                str = what[i] + str;
            }
        }
        
        return str;
    }
    
    Game = {};
    
    Game.Launch = function(){
        Game.ready = 0;
        
        Game.Init = function(){
            Game.ready = 1;
            
            Game.T = 0;
            Game.fps = 30;
            
            Game.version = 0.1;
            
            Game.time = new Date().getTime();
            
            Game.catchupLogic = 0;
            Game.accumulatedDelay = 0;
            
            // points and stuff
            Game.pointsEarned = 0;
            Game.pointClicks = 0;
            Game.points = 0;
            Game.pointsd = 0;
            Game.pointsPs = 0;
            Game.pointsReset = 0;
            
            // colors for the bg
            Game.red = 0;
            Game.green = 0;
            Game.blue = 0;
            
            // earn – economics
            Game.Earn = function(howmuch){
                Game.points += howmuch;
                Game.pointsEarned += howmuch;
            }
            
            Game.Spend = function(howmuch){
                Game.points -= howmuch;
            }
            
            Game.mouseCps = function(){
                var add = 0;
                if (Game.Has("Pencil fragments")) add += 0.1;
                if (Game.Has("Pencil")) add += 0.5;
                if (Game.Has("Ink")) add += 1;
                if (Game.Has("Brush")) add += 1.5;
                if (Game.Has("Paint-brush")) add += 2;
                
                var num = 0;
                for (var i in Game.Objects) { if(Game.Objects[i].name != "Cursor") num += Game.Objects[i].amount; }
            }
            
            Game.computedMouseCps = 1;
            Game.globalCpsMult = 1;
            Game.lastClick = 0;
            Game.autoclickerDetected = 0;
            Game.ClickPoint = function(){
                if (new Date().getTime() - Game.lastClick < 1000 / 250) {
                    // ??
                } else {
                    if (new Date().getTime() - Game.lastClick < 1000 / 15) {
                        Game.autoclickerDetected += Game.fps;
                        if (Game.autoclickerDetected >= Game.fps*5) console.log("King!");
                    }
                    Game.Earn(Game.computedMouseCps);
                    Game.pointClicks++;
                }
                Game.lastClick = new Date().getTime();
            }
            l("clicker").onclick = Game.ClickPoint; // The broken mouse convention! +1
            
            Game.tooltip={text:"",x:0,y:0,origin:0,on:0};
            Game.tooltip.draw=function(from,text,x,y,origin)
            {
                this.text=text;
                this.x=x;
                this.y=y;
                this.origin=origin;
                var tt=l("tooltip");
                var tta=l("tooltipAnchor");
                tta.style.display="block";
                var rect=from.getBoundingClientRect();
                //var screen=tta.parentNode.getBoundingClientRect();
                var x=0,y=0;
                tt.style.left="auto";
                tt.style.top="auto";
                tt.style.right="auto";
                tt.style.bottom="auto";
                tta.style.left="auto";
                tta.style.top="auto";
                tta.style.right="auto";
                tta.style.bottom="auto";
                tt.style.width="auto";
                tt.style.height="auto";
                if (this.origin=="left")
                {
                    x=rect.left;
                    y=rect.top;
                    tt.style.right="0";
                    tt.style.top="0";
                }
                else if (this.origin=="bottom-right")
                {
                    x=rect.right;
                    y=rect.bottom;
                    tt.style.right="0";
                    tt.style.top="0";
                }
                else {alert("Tooltip anchor "+this.origin+" needs to be implemented");}
                tta.style.left=Math.floor(x+this.x)+"px";
                tta.style.top=Math.floor(y-32+this.y)+"px";
                tt.innerHTML=unescape(text);
                this.on=1;
            }
            Game.tooltip.hide=function()
            {
                l("tooltipAnchor").style.display="none";
                this.on=0;
            }
            Game.getTooltip=function(text,x,y,origin)
            {
                origin=(origin?origin:"middle");
                return 'onMouseOut="Game.tooltip.hide();" onMouseOver="Game.tooltip.draw(this,\''+escape(text)+'\','+x+','+y+',\''+origin+'\');"';
            }
            
            Game.RebuildStore=function()//redraw the store from scratch
            {
                var str='';
                for (var i in Game.Objects)
                {
                    var me=Game.Objects[i];
                    str+='<div class="product" '+Game.getTooltip(
                    '<div style="min-width:300px;"><div style="float:right;"><span class="price">'+Beautify(Math.round(me.price))+'</span></div><div class="name">'+me.name+'</div>'+'<small>[owned : '+me.amount+'</small>]<div class="description">'+me.desc+'</div></div>'
                    ,0,0,'left')+' onclick="Game.ObjectsById['+me.id+'].buy();" id="product'+me.id+'"><div class="icon" style="background-image:url(img/'+me.icon+'.png);"></div><div class="content"><div class="title">'+me.displayName+'</div><span class="price">'+Beautify(Math.round(me.price))+'</span>'+(me.amount>0?('<div class="title owned">'+me.amount+'</div>'):'')+'</div></div>';
                }
                l('products').innerHTML=str;
                Game.storeToRebuild=0;
            }
            
            // things
            Game.storeToRebuild = 1;
            Game.Objects = [];
            Game.priceIncrease = 1.05;
            Game.ObjectsById = [];
            Game.ObjectsN = 0;
            Game.ThingsOwned = 0;
            Game.Object = function(name, commonName, desc, price, cps){
                this.id = Game.ObjectsN;
                this.name = name;
                commonName = commonName.split("|");
                this.single = commonName[0];
                this.plural = commonName[1];
                this.actionName = commonName[2];
                this.desc = desc;
                this.basePrice = price;
                this.price = this.basePrice;
                this.cps = cps;
                
                this.amount = 0;
                this.bought = 0;
                
                this.buy = function(){
                    var price = this.basePrice * Math.pow(Game.priceIncrease, this.amount);
                    
                    if (Game.points > price) {
                        Game.Spend(price);
                        this.amount++;
                        this.bought++;
                        price = this.basePrice * Math.pow(Game.priceIncrease, this.amount);
                        this.price = price;
                        if (this.amount == 1 && this.id != 0) l("row"+this.id).className = "row enabled";
                        Game.ThingsOwned++;
                    }
                }
                this.sell = function(){
                    var price = this.basePrice * Math.pow(Game.priceIncrease, this.amount);
                    price = Math.floor(price*0.5);
                    
                    if (this.amount > 0) {
                        Game.points += price;
                        this.amount--;
                        price = this.basePrice * Math.pow(Game.priceIncrease, this.amount);
                        this.price = price;
                        Game.ThingsOwned--;
                    }
                }
                
                Game.Objects[this.name] = this;
                Game.ObjectsById[this.id] = this;
                Game.ObjectsN++;
                return this;
            }
            
            new Game.Object("Pencil", "pencil|pencils|clicked", "Auto clicks every 10 seconds", 15, 0.5);
            
            Game.Loop();
        }
        
        // lógica  
            Game.Logic = function(){
                Game.Earn(Game.pointsPs / Game.fps);
                
                for (var i in Game.Objects) {
                    var me = Game.Objects[i];
                    me.totalPoints += me.storedTotalCps / Game.fps;
                }
                     
                Game.pointsd += (Game.points - Game.pointsd) * 0.3;
                
                Game.RebuildStore();
            }
            
            // draw
            Game.Draw = function(){
                var unit = (Math.round(Game.pointsd) <= 1 ? " fragment" : " fragments");
                if (Math.round(Game.pointsd).toString().length > 11) unit = "<br>fragments";
                
                // updates the points
                l("counter").innerHTML = Beautify(Math.round(Game.pointsd)) + unit;
                l("per-second").innerHTML = Beautify(Game.pointsPs, 1) + " per second";
            }
        
        // da loop!
        Game.Loop = function(){
            Game.catchupLogic = 0;
            Game.Logic();
            Game.catchupLogic = 1;
                
            //latency compensator
            Game.accumulatedDelay += ((new Date().getTime() - Game.time) - 1000 / Game.fps);
            Game.accumulatedDelay = Math.min(Game.accumulatedDelay, 1000 * 5);
            Game.time = new Date().getTime();
            while (Game.accumulatedDelay > 0) {
                Game.Logic();
                Game.accumulatedDelay -= 1000 / Game.fps;
            }
            Game.catchupLogic=0;

            Game.Draw();

            setTimeout(Game.Loop, 1000 / Game.fps);
        }
    }
    
    // seja que zeus quiser
    Game.Launch();
    
    window.onload = function() {
        if (!Game.ready) Game.Init();  
    };
    
})();