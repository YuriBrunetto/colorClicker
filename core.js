(function(){
    
    function l(what) { return document.getElementById(what); }

    function Beautify(what, floats) { // turns 9999999 into 9,999,999 -�� by Orteil => http://orteil.dashnet.org/
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

    function alerta(msg) {
        l("alerta").innerHTML = msg;
        l("alerta").style.opacity = 1;
        setTimeout(function(){ l("alerta").style.opacity = 0; }, 3000);
        return false;
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

            Game.Errors = [
                "More fragments are required!",
                "You can't afford that, mate.",
                "Nope.",
                "Maybe later.",
                "Are you kidding? Just click the damn button."
            ];

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

            // first color
            var _colors = ["red", "green", "blue"];
            var r = Math.floor(Math.random() * _colors.length);

            Game.colorMaster = _colors[r];

            // save stuff
            Game.SaveTo = "TheFuckingColorClicker";
            Game.LocalStorage = 1;

            Game.startDate = parseInt(new Date().getTime());

            // Penalidade se ficar muito tempo fora
            Game.inactivityTime = function() {
                var t;
                window.onload        = resetTimer;
                document.onmousemove = resetTimer;
                window.onmousedown   = resetTimer; // catches touchscreen presses
                window.onclick       = resetTimer; // catches touchpad clicks
                window.onscroll      = resetTimer; // catches scrolling with arrow keys
                document.onkeypress  = resetTimer;

                function minusPoints() {
                    if (Game.points >= 20 && Game.pointsPs > 0.1) {
                        Game.points -= Game.points / 2;
                    }
                }

                function resetTimer() {
                    clearTimeout(t);
                    t = setInterval(minusPoints, 300000); // cada 30 min
                }
            }

            Game.inactivityTime();

            // save
            Game.SaveGame = function(){
                var str = "";
                    str += Game.version + "|";
                    str += parseInt(Game.startDate) + "|";
                    str += parseFloat(Math.floor(Game.points))+";"+
                    parseFloat(Math.floor(Game.pointsEarned))+";"+
                    parseInt(Math.floor(Game.pointClicks))+";"+
                    parseInt(Math.floor(Game.red))+";"+
                    parseInt(Math.floor(Game.green))+";"+
                    parseInt(Math.floor(Game.blue))+";"+
                    parseFloat(Math.floor(Game.pointsReset))+ "|";
                for (var i in Game.Objects) {
                    var me = Game.Objects[i];
                    str += me.amount + "," + me.bought + "," + me.price + ";";
                }

                if (Game.LocalStorage) {
                    str += "!END!";
                    str = escape(str);

                    window.localStorage.setItem(Game.SaveTo, str);
                } else {
                    var now = new Date();
                    now.setFullYear(now.getFullYear() + 5);
                    str = str + "!END!";
                    str = "ColorClickerGame=" + escape(str) + "; expires=" + now.toUTCString() + ";";
                    document.cookie = str;
                }
            }

            // load
            Game.LoadGame = function(){
                var str;

                if (Game.LocalStorage) {
                    var localStorage = window.localStorage.getItem(Game.SaveTo);
                    if (localStorage) str = unescape(localStorage);
                } else {
                    if (document.cookie.indexOf(Game.SaveTo) >= 0) str = unescape(document.cookie.split(Game.SaveTo + "=")[1]);
                }

                if (str == "null" || str == undefined) {
                    l("new-game").style.display = "block";
                } else {
                    str                 = str.split("!END!")[0];
                    var spl             = "";
                    str                 = str.split("|");
                    Game.startDate      = parseInt(spl[0]);
                    spl                 = str[2].split(";"); // points
                    Game.points         = parseFloat(spl[0]);
                    Game.pointsEarned = parseFloat(spl[1]);
                    Game.pointClicks    = spl[2] ? parseInt(spl[2]) : 0;
                    Game.red            = parseInt(spl[3]);
                    Game.green          = parseInt(spl[4]);
                    Game.blue           = parseInt(spl[5]);
                    spl                 = str[3].split(";"); // buildings
                    Game.BuildingsOwned = 0;
                    for (var i in Game.ObjectsById) {
                        var me = Game.ObjectsById[i];
                        if (spl[i]) {
                            var mestr = spl[i].toString().split(",");
                            me.amount = parseInt(mestr[0]);
                            me.bought = parseInt(mestr[1]);
                            me.price = mestr[2];
                            Game.BuildingsOwned += me.amount;
                        } else {
                            me.bought = 0;
                            me.totalPoints = 0;
                        }
                    }
                }

                Game.recalculateGains = 1;
				Game.storeToRebuild = 1;
				Game.upgradesToRebuild = 1;
            }

            // delete localStorage - FUCKING HARD DELETE MOTHERFUCKER
            Game.DeleteSave = function() {
                // points and stuff
                Game.pointsEarned = 0;
                Game.pointClicks = 0;
                Game.points = 0;
                Game.pointsd = 0;
                Game.pointsPs = 0;
                Game.pointsReset = 0;
                Game.points = 0;

                // colors for the bg
                Game.red = 0;
                Game.green = 0;
                Game.blue = 0;

                Game.startDate = parseInt(new Date().getTime());

                Game.BuildingsOwned = 0;

                for (var i in Game.ObjectsById) {
                    var me = Game.ObjectsById[i];

                    me.amount = 0;
                    me.bought = 0;
                    Game.BuildingsOwned = 0;
                    me.bought = 0;
                    me.totalPoints = 0;
                    me.increase = 0;
                    Game.storeToRebuild = 1;
                }

                window.location.reload(true);
            }

            // earn economics
            Game.Earn = function(howmuch){
                Game.points += howmuch;
                Game.pointsEarned += howmuch;
            }

            Game.Spend = function(howmuch){
                Game.points -= howmuch;
            }

            Game.mouseCps = function(){
                var add = 0;
                return Game.ComputeCps(1, 0, 0, add);
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
                        if (Game.autoclickerDetected >= Game.fps * 5) { // se for muito r�pido
                            Game.points = 0;
                            alerta("So, you're a smartass, huh?! No points for you.");
                        }
                    }

                    // bg clicker random
                    var c1 = Math.floor(Math.random() * (200 - 20 + 1)) + 20;
                    var c2 = Math.floor(Math.random() * (200 - 20 + 1)) + 20;
                    var c3 = Math.floor(Math.random() * (200 - 20 + 1)) + 20;

                    l("clicker").style.background = "rgb(" + c1 + ", " + c2 + ", " + c3 + ")";

                    Game.Earn(Game.computedMouseCps);
                    Game.pointClicks++;
                }

                Game.lastClick = new Date().getTime();
            }

            l("clicker").onclick = Game.ClickPoint; // The broken mouse convention! +1

            // cps
            Game.recalculateGains = 1;
            Game.CalculateGains = function(){
                Game.pointsPs = 0;

                for (var i in Game.Objects) {
                    var me = Game.Objects[i];
                    me.storedCps = (typeof(me.cps) == "function" ? me.cps() : me.cps);
                    me.storedTotalCps = me.amount * me.storedCps;
                    Game.pointsPs += me.storedTotalCps;
                }

                Game.pointsPs *= Game.globalCpsMult;
                Game.computedMouseCps = Game.mouseCps();
                Game.recalculateGains = 0;
            }

            Game.RebuildStore = function() {
                var str = "";

                for (var i in Game.Objects) {
                    var me = Game.Objects[i];

                    str += "<a href='javascript:;' class='store-a' onclick='Game.ObjectsById[" + me.id + "].buy();' id='object-" + me.id + "' title='" + me.name + "'>";
                    str += me.name;
                    str += "<span class='store-span'> Cost: " + Beautify(me.price) + " fragments, | " + me.amount + " purchased</span>";
                    str += "<div class='clear-both'></div>";
                    str += "<div class='store-desc'>" + me.desc + "</div>";
                    str += "<div class='store-can-afford' id='can-afford-" + me.id + "'></div>";
                    str += "<div class='store-bullet' id='store-bullet-" + me.id + "'></div>"
                    str += "<div class='clear-both'></div>";
                    str += "</a>";
                }

                l('products').innerHTML = str;

                for (var i in Game.Objects) {
                    var obj = Game.Objects[i];

                    if (Game.points >= obj.price) {
                        l("store-bullet-" + obj.id).style.backgroundColor = "#27ae60";
                    } else {
                        l("store-bullet-" + obj.id).style.backgroundColor = "#b82d51";
                    }
                }

                Game.storeToRebuild = 0;
            }

            Game.Has = function(what) {
                return (Game.Objects[what] ? Game.Objects[what].bought : 0);
            }

            // things
            Game.storeToRebuild = 1;
            Game.Objects = [];
            Game.priceIncrease = 1.05;
            Game.ObjectsById = [];
            Game.ObjectsN = 0;
            Game.ThingsOwned = 0;
            Game.Object = function(name, desc, price, increase, cps, red, green, blue){
                this.id        = Game.ObjectsN;
                this.name      = name;
                this.desc      = desc;
                this.basePrice = price;
                this.price     = this.basePrice;
                this.increase  = increase;
                this.cps       = cps;
                this.red       = red;
                this.green     = green;
                this.blue      = blue;

                this.amount    = 0;
                this.bought    = 0;

                this.buy = function(e){
                    var price = Math.floor(this.basePrice * Math.pow(Game.priceIncrease, this.amount));

                    if (Game.points >= price) {
                        Game.Spend(price);
                        this.amount++;
                        this.bought++;
                        price       = this.basePrice * Math.pow(Game.priceIncrease, this.amount);
                        this.price  = price;

                        Game.red   += this.red;
                        Game.green += this.green;
                        Game.blue  += this.blue;

                        Game.recalculateGains = 1;
                        Game.ThingsOwned++;
                        Game.RebuildStore();
                    } else {
                        var randomError = Math.floor(Math.random() * Game.Errors.length);
                        alerta(Game.Errors[randomError]);
                    }
                }

                Game.Objects[this.name] = this;
                Game.ObjectsById[this.id] = this;
                Game.ObjectsN++;
                return this;
            }

            // name, desc, price, increase, cps, red, green, blue, costR, costG, costB
            new Game.Object("Pencil", "Gives to you 1 point of blue and 0.1 fragments per second.", 50, 2, 0.1, 0, 0, 1);
            new Game.Object("Ink", "Gives to you 2 points of blue and 0.1 fragments per second.", 250, 3, 0.1, 0, 0, 2);
            new Game.Object("Paint Brush", "Gives to you 1 point of green and 0.1 fragments per second.", 450, 4, 0.1, 0, 1, 0);
            new Game.Object("Master Brush", "Gives to you 2 points of green, 1 point of blue and 0.2 fragments per second.", 1000, 5, 0.2, 0, 2, 1);
            new Game.Object("Spray", "Gives to you 5 points of green, 2 points of blue and 0.4 fragments per second.", 2500, 6, 0.4, 0, 5, 2);
            new Game.Object("Red Brush", "Gives to you 2 points of red and 0.4 fragments per second.", 3000, 7, 0.4, 2, 0, 0);

            Game.ComputeCps = function(base, add, mult, bonus) {
                if (!bonus) bonus = 0;
                return ((base + add) * (Math.pow(2, mult)) + bonus);
            }

            Game.LoadGame();
            Game.ready = 1;
            Game.Loop();
        }

        // l�gica
        Game.Logic = function(){
            Game.Earn(Game.pointsPs / Game.fps);

            for (var i in Game.Objects) {
                var me = Game.Objects[i];
                me.totalPoints += me.storedTotalCps / Game.fps;
            }

            Game.pointsd += (Game.points - Game.pointsd) * 0.3;

            if (Game.recalculateGains) Game.CalculateGains();
            Game.Earn(Game.pointsPs / Game.fps);

            if (Game.storeToRebuild)
                Game.RebuildStore();

            if (Game.red >= 255)
                Game.red = 255;

            if (Game.green >= 255)
                Game.green = 255;

            if (Game.blue >= 255)
                Game.blue = 255;

            // if (Game.red == 255 && Game.green == 255 && Game.blue == 255)
            //     Game.Win();

            Game.SaveGame();
        }

        // draw
        Game.Draw = function(){
            var unit = (Math.round(Game.points) <= 1 ? " fragment" : " fragments");
            if (Math.round(Game.points).toString().length > 11) unit = "<br>fragments";

            // updates the points
            l("counter").innerHTML = Beautify(Math.round(Game.points)) + unit;
            l("per-second").innerHTML = Beautify(Game.pointsPs, 1) + " per second";

            // updates the bg color
            l("color").innerHTML = "rgb(" + Game.red + "," + Game.green + "," + Game.blue + ")";
            l("content-color").style.backgroundColor = "rgba(" + Game.red + ", " + Game.green + ", " + Game.blue + ", 1)";

            for (var i in Game.Objects) {
                var obj = Game.Objects[i];
                var preco = Math.floor(obj.price);

                if (Game.points >= preco) {
                    l("store-bullet-" + obj.id).style.backgroundColor = "#27ae60";
                    l("can-afford-" + obj.id).innerHTML = "can afford";
                } else {
                    l("store-bullet-" + obj.id).style.backgroundColor = "#b82d51";
                    l("can-afford-" + obj.id).innerHTML = "can't afford";
                }
            }

            document.title = Beautify(Game.points) + " " + (Game.points == 1 ? "fragment":"fragments") + " - colorClicker";
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
            Game.catchupLogic = 0;

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
