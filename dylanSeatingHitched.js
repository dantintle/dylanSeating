//window.addEvent('domready', function() {

// Array Remove - By John Resig (MIT Licensed)
Array.prototype.remove = function(from, to) {
  var rest = this.slice((to || from) + 1 || this.length);
  this.length = from < 0 ? this.length + from : from;
  return this.push.apply(this, rest);
};
Array.prototype.insertAt = function(o, index){    
  if ( index > -1 && index <= this.length ) {
      this.splice(index, 0, o);
      return true;
  }        
  return false;
};
var Generic = {
  PathGetX: function(graphic) {
    var myGraphic = graphic ? graphic : this.graphic;
    return myGraphic.attr("ox");
  },
  PathGetY: function(graphic) {
    var myGraphic = graphic ? graphic : this.graphic;
    return myGraphic.attr("oy");
  },
  GetRotation: function(graphic) {
    var myGraphic = graphic ? graphic : this.graphic;
    return myGraphic.attr("rotation") ? myGraphic.attr("rotation") : 0;
  },

  ShapeGetX: function(graphic) {
    var myGraphic = graphic ? graphic : this.graphic;
    return myGraphic.attr("cx");
  },
  ShapeGetY: function(graphic) {
    var myGraphic = graphic ? graphic : this.graphic;
    return myGraphic.attr("cy");
  },
  SetRelativeGraphicPosition: function(x, y, graphic) {
    var myGraphic = graphic ? graphic : this.graphic,
        currentX = this.GetX(),
        currentY = this.GetY(),
        rotation = this.rotation;
    myGraphic.attr({
        ox: x,
        oy: y
    });
    
    //myGraphic.translate(x - currentX, y - currentY);
    //myGraphic.transform("t" + (x - currentX) + "," + (y - currentY));
    myGraphic.transform("t" + x + "," + y + "R" + rotation);
  },
  SetAbsoluteGraphicPosition: function(x, y, graphic) {
    var myGraphic = graphic ? graphic : this.graphic,
        currentX = this.GetX(),
        currentY = this.GetY();
    myGraphic.attr({
        ox: x,
        oy: y
    });
    //myGraphic.translate(x - currentX, y - currentY);
    myGraphic.transform("T" + x + "," + y);
  },
  SetShapeGraphicPosition: function(x, y) {
    this.graphic.attr({
      cx: x,
      cy: y
    });
  },
  SetRotation: function(r, graphic) {
     var myGraphic = graphic ? graphic : this.graphic,
        currentX = this.GetX(),
        currentY = this.GetY(),
        rotation = r;
    /*
     myGraphic.attr({
        ox: x,
        oy: y
    });
    */
    //myGraphic.translate(x - currentX, y - currentY);
    //myGraphic.transform("t" + (x - currentX) + "," + (y - currentY));
    myGraphic.transform("t" + currentX + "," + currentY + "R" + rotation);
  }
};
var paper = Raphael("board", 900, 900),
    animationTime = 300,
    colGuest = "yellow",
    colGuestStroke = "black",
    colGuestMoveStroke = "blue",
    colGuestSwapStroke = "purple",
    colTable = "purple",
    colTableStroke = "black",
    colTableSelectedStroke = "yellow",
    colToolbarBack = "cyan",
    colSeatSelectedStroke = "blue",
    shapes = {guest:  "M -10 -10 L 10 -10 L 0 10 z",
              desk:   "m-60,0l0,60l120,0l0,-60c-45,20 -75,20 -120,0z",
              seat:   "M -20 -10 L 20 -10 L 0 10 z"
              //seat:   "M -20 -50 L 20 -50 L 0 -20 z"
              };
    inrange = false,
    seatList = [],
    draggableGuests = [],
    AllEvents = [],
    AllEventsAuditBox = paper.text(200, 20, "loaded"),
    myTables = [],
    myGuests = [
                {name: "adam hall"},
                {name: "simon dawson"},
                {name: "aimee read"}
                ];
     /*scene = {seatList: [],draggableGuests: [],AllEvents: [],AllEventsAuditBox: paper.text(200, 20, "loaded"),myTables: [],myGuests: [
                {name: "adam hall"},
                {name: "simon dawson"},
                {name: "aimee read"}
                ]
    };*/

paper.customAttributes = {
  
  model: function(model) {
    this.myModel = model;
    return this.myModel;
  },
  ox: function(ox) {
    this.myOx = ox;
    return this.myOx;
  },
  oy: function(oy) {
    this.myOy = oy;
    return this.myOy;
  },
  fromTableX: function(fromTableX) {
    this.myfromTableX = fromTableX;
    return this.myfromTableX;
  },
  fromTableY: function(fromTableY) {
    this.myfromTableY = fromTableY;
    return this.myfromTableY;
  },
  rotation: function(rotation) {
    this.myrotation = rotation;
    return this.myrotation;
  }
};


function logEvent(eventText) {
    AllEvents.push(eventText);
    AllEventsAuditBox.remove();
    AllEventsAuditBox = paper.text(
    400, 200, AllEvents.slice(-20).join("\n"));
}
var dragThreshold =  15,
    scene = {
  SeatConflictCheck: function(thisSeat) {
    logEvent("scene.SeatConflictCheck");
    for (var i = 0; i < seatList.length; i++) {
        var seatCheck = seatList[i];
        if (seatCheck.guest === thisSeat.guest && seatCheck !== thisSeat) {
            logEvent("Seat conflict");
            seatCheck.guest = null;
            seatCheck.isoccupied = false;
        }
    }
  },
  GetCachedListOfSeatAreas: function() {
    possibleSeats = [];
    for (var i = 0; i < seatList.length; i++) {
        possibleSeats[i] = {
            t: seatList[i].GetY() - dragThreshold,
            r: seatList[i].GetX() + dragThreshold,
            b: seatList[i].GetY() + dragThreshold,
            l: seatList[i].GetX() - dragThreshold
        };
    }
    return possibleSeats;
  }
  
            
}
var
ToolBar = function() {
  this.background = paper.rect(600,20,200,600, 5);
  this.background.attr({
    fill: colToolbarBack,
    stroke: colTableStroke,
    model: this
  });
  this.toolBox = [];
  this.generateGuestSelect = function() {
    var obj = {
      graphic: undefined,
      type: "guest",
      createObject: function(x,y) {
        if(!x) {x = 30;}
        if(!y) {y = 30;}
        return LoadData({guests:[{name:"Example New Guest", x:x, y:y}]});
      }
    };
    var guestSelect = paper.path(shapes.guest);
    guestSelect.attr({
        fill: colGuest,
        stroke: colGuestStroke,
        model: obj,
        ox: 0,
        oy: 0
    });
    obj.graphic = guestSelect;
    return obj;
  
  };
  this.generateTableSelect = function() {
    var obj = {
      graphic: undefined,
      type: "table",
      createObject: function(x,y) {
        if(!x) {x = 200;}
        if(!y) {y = 200;}
        return LoadData({tables:[{type:"table",x:x, y:y, seatCount: 5}]});
      }
    };
    var tableSelect = paper.circle(0, 0, 20);
    tableSelect.attr({
        fill: colTable,
        stroke: colTableStroke,
        model: obj,
        ox: 0,
        oy: 0,
        type: "table"
    });
    //return tableSelect;
    obj.graphic = tableSelect;
    return obj;
  };
  this.generateDeskSelect = function() {
    
    var obj = {
      graphic: undefined,
      type: "desk",
      createObject: function(x,y) {
        if(!x) {x = 400;}
        if(!y) {y = 400;}
        LoadData({tables:[{type:"desk",x:x, y:y, rotation: 90}]});     
      }
    };
    var tableSelect = paper.path(shapes.desk);
    tableSelect.attr({
        fill: colTable,
        stroke: colTableStroke,
        model: obj,
        ox: 0,
        oy: 0,
        type: "desk"
    });
    //return tableSelect;
    obj.graphic = tableSelect;
    return obj;
  }

  this.AddToolBoxItem = function(obj, helperText, type) {
    this.toolBox.push(obj);
    this.type = type;
    var item = obj.graphic;
    var offsetY = (this.toolBox.length * 50);
    //item.translate(650, offsetY);
    item.transform("t650," + offsetY);
    item.attr({ox:650, oy:offsetY});
    item.mouseover(function(event) {
        logEvent("Over ToolboxItem");
        this.animate({
                "stroke-width": 2,
                stroke: colTableSelectedStroke
        }, animationTime);
        this.attr("model").text = paper.text(this.attr("ox") + 75, this.attr("oy"), helperText);
        this.attr("model").text.show();
    });
    item.mouseout(function(event) {
        logEvent("Out ToolboxItem");
        this.animate({
               "stroke-width": 1,
               stroke: colTableStroke
        }, animationTime);
        if (this.attr("model").text) {
            this.attr("model").text.hide();
        }
    });
    /*item.click(function(event) {
      logEvent("Click toolbox item: " + this.attr("model").type);
      this.attr("model").createObject();
    });*/
    obj.setGraphicPosition = Generic.SetRelativeGraphicPosition;/*function(x, y) {
    
        var currentX = this.GetX(),
            currentY = this.GetY();
        this.graphic.attr({
            ox: x,
            oy: y
        });
        this.graphic.translate(x - currentX, y - currentY);
        
    };*///Generic.SetRelativeGraphicPosition;
    
    obj.GetX = Generic.PathGetX;/*function() {
        return this.graphic.attr("ox");
    };*/
    obj.GetY = Generic.PathGetY;/*function() {
        return this.graphic.attr("oy");
    };*/
    
  var //possibleSeats = [],
        start = function(event) {
            var model = this.attr("model");
            //model.startDrag();
            this.ox = this.attr("ox");
            this.oy = this.attr("oy");
            this.animate({
                "stroke-width": 3,
                opacity: 0.7
            }, animationTime);
        },
        move = function(mx, my) {
            var model = this.attr("model");
            //inrange = false;

            var mouseCX = this.ox + mx,
                mouseCY = this.oy + my,
                lockX = 0,
                lockY = 0;

            //logEvent("Move Toolbox thing: " + mouseCX);
            var myStroke = colGuestStroke;
            model.setGraphicPosition(mouseCX, mouseCY);
            this.attr({
                stroke: myStroke
            }); 
        },
        up = function() {
            var model = this.attr("model");
            var inToolBox = MyToolBar.background.getBBox().x < model.GetX();
            
            if (inToolBox) {
              model.createObject();
            } else {
                //model.ghost.remove();
                //model.removeFromSeat();
              model.createObject(model.GetX(), model.GetY());
            }
            this.animate({
              "stroke-width": 2,
              opacity: 1
              //ox:this.ox,
              //oy: this.oy
               
            }, animationTime);
            model.setGraphicPosition(this.ox,this.oy);
            
        };
    item.drag(move, start, up);
    
   
   
  }
  this.AddToolBoxItem(this.generateGuestSelect(), "Add new person", "guest");
  this.AddToolBoxItem(this.generateTableSelect(), "Add new table", "table");
  this.AddToolBoxItem(this.generateDeskSelect(), "Add new desk", "desk");
  
  
  
  
}
Guest = function(name, x, y) {
    logEvent("Create Guest");
    this.name = name;
    this.text = false;
    this.graphic = paper.path(shapes.guest);//deskShape);//
    this.graphic.attr({
        ox: 0,
        oy: 0
    });
    this.graphic.attr({
        fill: colGuest,
        stroke: colGuestStroke,
        model: this
    });
    this.graphic.mouseover(function(event) {
      this.animate({
          "stroke-width": 2
      }, animationTime);
    });
    this.graphic.mouseout(function(event) {
        this.animate({
            "stroke-width": 1
        }, animationTime);
    });
    this.startDrag = function() {
        this.hideName();
        this.ghost = this.graphic.clone();
        this.ghost.attr("opacity", 0.3);
    };
    this.overEmptySeat = function(x, y, seat) {
        this.showHelpText("Move " + this.name + " to this seat", x, y);
        //this.graphic.attr("rotation", seat.GetRotation());
        this.graphic.attr("transform", "...r" + seat.GetRotation());
    };
    this.overOccupiedSeat = function(x, y, seat) {
        this.showHelpText("Swap " + this.name + " with " + seat.guest.name, x, y);
        seat.guest.hideName();
    
    };
    this.moveGhostToNewLocation = function() {
        if (this.ghost) {
            this.ghost.model = this;
            this.ghost.animate({
                path: this.graphic.attr("path")
            }, animationTime, "<", function() {
                this.model.showHelpText(this.model.name);
                this.model.graphic.animate({
                    opacity: 1
                }, animationTime);
                this.remove();
            });
        }
    };
    this.removeFromSeat = function() {
        logEvent("remove from seat " + this.name);
        var seatCX = 0,
            seatCY = 0;
        this.seat = false;
        this.animateToSpot(seatCX, seatCY, 0);
        
    };
    this.animateToSpot = function(x, y, rotation) {
        this.graphic.model = this;
        var myX = this.GetX(),
            myY = this.GetY(),
            translateX = x - myX,
            translateY = y - myY;
        this.graphic.animate({
            //translation: translateX + " " + translateY,
            //rotation: rotation
            transform: "...t" + translateX + "," + translateY + "r" + rotation
        }, animationTime, ">", function() {
            this.attr({
                ox: x,
                oy: y
            });
            this.model.showHelpText(this.model.name);
        });
    };
    this.swapWithGuestAt = function(seat) {
        var meGuest = this;
        var meSeat = this.seat;
        var themGuest = seat.guest;
        var themSeat = seat;
        logEvent("Swap " + meGuest.name + " from seat occupied by " + themGuest.name + ".");
        if (meSeat) {
            themGuest.moveToSeat(meSeat);
        } else {
            themGuest.removeFromSeat();
        }
        meGuest.moveToSeat(themSeat);
        //Consider for swapping 
        //object making them go 
        //in a curved line 
        //rather than straight.
    };
    this.makeSureMainGraphicIsInRightPlace = function(seat) {
        var myCX = this.GetX(),
            myCY = this.GetY(),
            seatCX = seat.GetX(),
            seatCY = seat.GetY(),
            seatRotation = seat.GetRotation();
        if (myCX != seatCX || myCY != seatCY) {
            logEvent("Seat not in right place for " + this.name);
            this.animateToSpot(seatCX, seatCY, seatRotation);
        } else {
            //this.graphic.attr("rotation", seatRotation);
            this.graphic.attr("transform", "R" + seatRotation);
            
        }
    };
    this.moveToSeat = function(seat) {
    
    
        logEvent("seat move for " + this.name);
        this.makeSureMainGraphicIsInRightPlace(seat);
        this.seat = seat;
        this.seat.isoccupied = true;
        this.seat.guest = this;
        this.moveGhostToNewLocation();
        scene.SeatConflictCheck(this.seat);
        
    };
    
    this.GetX = Generic.PathGetX;/*function() {
        return this.graphic.attr("ox");
    };*/
    this.GetY = Generic.PathGetY;/*function() {
        return this.graphic.attr("oy");
    };*/
    this.Rotation = Generic.Rotation;
    this.setGraphicPositionBase = Generic.SetRelativeGraphicPosition;
    this.setGraphicPosition = function(x, y) {
      this.setGraphicPositionBase(x,y);
      if (this.text) {
        this.text.attr({
          x: x,
          y: y - 20
        });
      }
    };
    this.showHelpText = function(text, x, y) {
        if (!x) {
            x = this.graphic.attr("ox");
        }
        if (!y) {
            y = this.graphic.attr("oy");
        }
        if (text) {
            this.hideName();
            this.text = paper.text(x, y - 20, text);
            this.text.show();
        }
    };
    this.hideName = function() {
        if (this.text) {
            this.text.hide();
        }
    };
        
    
    
    
    this.setGraphicPosition(x, y);
    this.showHelpText(this.name);
    var //possibleSeats = [],
        start = function(event) {
            var model = this.attr("model");
            model.startDrag();
            this.ox = this.attr("ox");
            this.oy = this.attr("oy");
            possibleSeats = scene.GetCachedListOfSeatAreas();
            this.animate({
                "stroke-width": 3,
                opacity: 0.7
            }, animationTime);
        },
        move = function(mx, my) {
            var model = this.attr("model");
            inrange = false;

            var mouseCX = this.ox + mx,
                mouseCY = this.oy + my,
                lockX = 0,
                lockY = 0;

            var myStroke = colGuestStroke;
            for (var i = 0; i < seatList.length; i++) {
                var seatCheck = possibleSeats[i];

                if ((seatCheck.t < mouseCY && seatCheck.b > mouseCY) && (seatCheck.r > mouseCX && seatCheck.l < mouseCX)) {
                    var mySeat = seatList[i];
                    inrange = true;

                    lockX = mySeat.GetX();
                    lockY = mySeat.GetY();
                    if (mySeat.isoccupied) {
                        myStroke = colGuestSwapStroke;
                        model.overOccupiedSeat(lockX, lockY, mySeat);
                    } else {
                        myStroke = colGuestMoveStroke;
                        model.overEmptySeat(lockX, lockY, mySeat);

                    }

                }
            }
            if (inrange) {
                model.setGraphicPosition(lockX, lockY);
                this.attr({
                    stroke: myStroke
                });
            } else {
                model.hideName();
                model.setGraphicPosition(mouseCX, mouseCY);
            }

        },
        up = function() {
            var model = this.attr("model");
            if (inrange) {
                for (var i = 0; i < seatList.length; i++) {
                    var s = seatList[i];
                    if (s.GetX() == model.GetX() && s.GetY() == model.GetY()) {
                        if (s.isoccupied) {
                            model.swapWithGuestAt(s);
                        } else {

                            model.moveToSeat(s);
                        }
                    }
                }
            } else {
                model.ghost.remove();
                model.removeFromSeat();
            }
              this.animate({
            "stroke-width": 2
            }, animationTime);
        };
    this.graphic.drag(move, start, up);
    this.ToJson = function() {
      return {
        name:this.name,
        x:this.GetX(),
        y:this.GetY()
      };
    }
},
Seat = function(x, y, rotation, table, seatNumber) {
    logEvent("Create Seat");
    this.table = table;
    this.rotation = rotation;
    this.graphic = paper.path(shapes.seat);//paper.path(GenerateCirclePath(x,y,15));//
    this.seatNumber = seatNumber;
    this.SetRotation = function(rotation) {
      this.rotation = rotation;
      this.SetBaseRotation(rotation);
      //this.graphic.attr({"transform":"R" + rotation});
    }
    this.graphic.attr({
        ox: x,
        oy: y,
        fill: "blue",
        //rotation: rotation,
        model: this
    });
    //this.graphic.translate(x, y);
    this.graphic.transform("...t" + x + "," + y);
    
    this.GetX = Generic.PathGetX;/*function() {
        return this.graphic.attr("ox");
    };*/
    this.GetY = Generic.PathGetY;/*function() {
        return this.graphic.attr("oy");
    };*/
    this.SetBaseRotation = Generic.SetRotation;
    this.setGraphicPositionBase = Generic.SetRelativeGraphicPosition;
    
    this.GetRotation = function() {
        return this.graphic.attr("rotation");
    };
    this.setGraphicPosition = function(x, y) {
        this.setGraphicPositionBase(x,y);
        if (this.guest) {
            this.guest.setGraphicPosition(x, y);
        }
    };
    this.RemoveGuest = function() {
        if (this.guest) {
            logEvent("Remove seat for " + this.guest.name);
        }
        this.guest = false;
        this.isoccupied = false;
    };
    this.remove = function() {
      this.RemoveGuest();
      this.graphic.remove();
    }
    this.RemoveGuest();
    seatList.push(this);
    
    this.ToJson = function() {
    var myGuest;
    if(this.guest) {
      myGuest = this.guest.ToJson()
    }
      return {
        type:"seat",
        rotation:this.rotation,
        x:this.GetX(),
        y:this.GetY(),
        guest: myGuest
      };
    };
    
    this.graphic.mouseover(function(event) {
        this.animate({
            "stroke-width": 2,
            stroke: colTableSelectedStroke,
            fill: "red"
        }, animationTime);
    });
    this.graphic.mouseout(function(event) {
        this.animate({
            "stroke-width": 1,
            stroke: colTableStroke,
            fill: "blue"
        }, animationTime);
    });
    this.graphic.click(function(event) {
        logEvent("click empty seat");
        var model = this.attr("model"),
            table = model.table;
        this.mouseout = function() {};
        table.removeSeat(model.seatNumber);
        
    });
},
SeatMarker = function(x,y,table,seatNumber) {
  logEvent("Create SeatMarker");
  this.table = table;
  this.seatNumber = seatNumber;
  
  this.graphic = paper.circle(x,y,4);
  //this.graphic = paper.path(GenerateCirclePath(x, y, 4));
  this.graphic.attr({
    fill: "blue",
    model: this
  });
  //this.GetX = Generic.ShapeGetX;//Generic.PathGetX;
  //this.GetY = Generic.ShapeGetY;//Generic.PathGetY;
  this.GetX = Generic.PathGetX;
  this.GetY = Generic.PathGetY;
  //this.setGraphicPositionBase = Generic.SetShapeGraphicPosition;
  //this.setGraphicPositionBase = Generic.SetAbsoluteGraphicPosition;
  this.setGraphicPositionBase = Generic.SetRelativeGraphicPosition;
  this.setGraphicPosition = function(pointTo, pointFrom) {
    if(pointFrom) {
      
    var mypath = PathGenerateCircularArc(pointFrom, pointTo, table.widthWithChairs);
                                             /*  {x:pointTo.x,y:table.GetY()},
                                               {x:this.GetX(),y:this.GetY()},
                                               20);*/
    /*
     if(this.graphic2) {
      this.graphic2.remove();
    }
    this.graphic2 = paper.path(mypath);
    this.graphic2.attr({
      fill: "green",
      model: this,
      opacity: 0.5
    });
    */
    var animateIt = false;
    if(animateIt) {
      this.setGraphicPositionBase( pointFrom.x, pointFrom.y);
      this.graphic.animate({transform:"t" + pointTo.x + "," + pointTo.y}, 300, true, function() {this.setGraphicPositionBase(pointTo.x, pointTo.y);} );
    } else {
      
    ////this.graphic.transform("...t" + pointFrom.x + "," + pointFrom.y);
    //this.graphic.translate(pointFrom.x, pointFrom.y);
    //this.graphic.animateAlong(mypath, 300,true);
    this.setGraphicPositionBase( pointTo.x, pointTo.y);
        }
//
    ;
    
    } else {
    //this.graphic.transform("...t" + pointTo.x + "," + pointTo.y);
    //this.graphic.translate(pointTo.x, pointTo.y);
    
    this.setGraphicPositionBase(pointTo.x, pointTo.y);
    }
    
  };
  /*
   
  */
  //this.graphic.translate(x, y);
  
  this.remove = function() {
    this.graphic.remove();
  }
  this.graphic.mouseover(function(event) {
      this.animate({
          "stroke-width": 2,
          stroke: colTableSelectedStroke,
          fill: "red"
      }, animationTime);
  });
  this.graphic.mouseout(function(event) {
      this.animate({
          "stroke-width": 1,
          stroke: colTableStroke,
          fill: "blue"
      }, animationTime);
  });
  this.graphic.click(function(event) {
      logEvent("click seatmarker");
      var model = this.attr("model"),
          table = model.table;
      table.addSeatFromMarker(model.seatNumber);
  });
},
GenerateCirclePath = function(x , y, r) {      
  var s = "M" + x + "," + (y-r) + "A"+r+","+r+",0,1,1,"+(x-0.1)+","+(y-r)+" z";   
  return s; 
},
PathGenerateCircularArc = function(point1, point2, radius) {
  point1.x = point1.x ? point1.x : 0;
  point1.y = point1.y ? point1.y : 0;
  point2.x = point2.x ? point2.x : 0;
  point2.y = point2.y ? point2.y : 0;
  
  return "M" + point1.x + " " + point1.y +  " L " + point1.x + " " + point1.y + " A " + radius + " " + radius + " 0 0 1 " + point2.x + " " + point2.y;
},

RoundTable = function(x, y, seatCount) {
    logEvent("Create RoundTable");
    this.seatCount = seatCount;
    this.GetX = Generic.ShapeGetX;
    this.GetY = Generic.ShapeGetY;
    this.GetCenter = function() {
      return {x:this.GetX(), y:this.GetY()};
    }
    this.GetTwelve = function() {
      return {x:this.GetX() , y:this.GetY() - this.widthWithChairs};
    }
    
    this.setGraphicPosition = Generic.SetShapeGraphicPosition;
    this.width = seatCount * 10;
    this.widthWithChairs = this.width + 20;
    this.graphic = paper.circle(x, y, this.width);
    this.seatSet = paper.set();
    this.seatSet.push(this.graphic);
    this.graphic.attr({
        fill: colTable,
        stroke: colTableStroke,
        model: this
    });
    this.tableSeatList = [];
    this.tableSeatAdditions = [];
    this.caclulateClockworkValues = function(divisions, pointNumber) {
      var alpha= 360 / divisions * pointNumber,
          a= (90 - alpha) * Math.PI / 180,
          x= this.GetX() + this.widthWithChairs * Math.cos(a),
          y= this.GetY() - this.widthWithChairs * Math.sin(a);
      return {alpha:alpha,a:a,x:x,y:y};
    }
    this.placeSeat = function(seatNumber) {
      var obj = this.caclulateClockworkValues(this.seatCount, seatNumber);
      this.tableSeatList[seatNumber].setGraphicPosition(obj.x,obj.y);
      this.tableSeatList[seatNumber].SetRotation(obj.alpha);
      this.tableSeatList[seatNumber].seatNumber = seatNumber;
    }
    //this.lastSeatMarker = {};
    this.placeSeatMarker = function(seatNumber) {
      var seatCount = seatNumber > -1 ? this.seatCount * 2 : 1,
          seatNumberWithOffset = seatNumber > -1 ? (seatNumber * 2) + 1 : 0,
          obj = this.caclulateClockworkValues(seatCount, seatNumberWithOffset),
          seatNumberFixed = seatNumber > -1 ? seatNumber : 0;
      
      this.tableSeatAdditions[seatNumberFixed].setGraphicPosition({x:obj.x,y:obj.y}, this.GetTwelve());
      this.tableSeatAdditions[seatNumberFixed].seatNumber = seatNumberFixed;
      //this.lastSeatMarker = {x:obj.x,y:obj.y};
    }
    this.addSeat = function(seatNumber) {
      var mySeat = new Seat(0, 0, 0, this, seatNumber);
      var mySeatMarker = new SeatMarker(0,0,this, seatNumber);
    
      this.tableSeatList.push(mySeat);
      this.tableSeatAdditions.push(mySeatMarker);
      
      this.seatSet.push(mySeat.graphic);
      this.seatSet.push(mySeatMarker.graphic);
      
    };
    this.addSeatFromMarker = function(markerNumber) {
      var mySeat = new Seat(0, 0, 0, this, markerNumber);
      var mySeatMarker = new SeatMarker(0,0,this, markerNumber);
    
      this.tableSeatList.insertAt(mySeat,markerNumber);
      this.tableSeatAdditions.insertAt(mySeatMarker,markerNumber);
      
      this.seatSet.push(mySeat.graphic);
      this.seatSet.push(mySeatMarker.graphic);
      
      this.seatCount = this.tableSeatList.length;
      for (var t = 0, l = this.tableSeatList.length; t < l; t++) {
        this.placeSeat(t);
        this.placeSeatMarker(t);
      }
      
    };
    this.removeSeat = function(index) {
      logEvent("remove seat" + index);
      var isLastSeat = (this.tableSeatList.length === 1);
      
      this.tableSeatList[index].remove();
      this.tableSeatList.remove(index);
      
      if(!isLastSeat) {
        this.tableSeatAdditions[index].remove();
        this.tableSeatAdditions.remove(index);
      }
      
      this.seatCount = this.tableSeatList.length;
      for (var t = 0, l = this.tableSeatList.length; t < l; t++) {
        this.placeSeat(t);
        this.placeSeatMarker(t);
      }
      if(isLastSeat) {
        this.placeSeatMarker();
      }
    };
    for (var t = 0; t < this.seatCount; t++) {
        this.addSeat(t);
        this.placeSeat(t);
        this.placeSeatMarker(t);
    }
    
    var
    start = function(event) {
        var model = this.attr("model");
        this.ox = model.GetX();
        this.oy = model.GetY();
        for (var i = 0, l = model.tableSeatList.length; i < l; i++) {
            var s = model.tableSeatList[i];
            s.graphic.attr({
                fromTableX: s.GetX(),
                fromTableY: s.GetY()
            });
        }
        for (var i = 0, l = model.tableSeatAdditions.length; i < l; i++) {
            var s = model.tableSeatAdditions[i];
            s.graphic.attr({
                fromTableX: s.GetX(),
                fromTableY: s.GetY()
            });
        }
        model.seatSet.attr({
            stroke: colSeatSelectedStroke  
        });
        this.attr("stroke", colTableSelectedStroke);
    },
    move = function(mx, my) {
        var model = this.attr("model"),
            mouseCX = this.ox + mx,
            mouseCY = this.oy + my;

        for (var i = 0, l = model.tableSeatList.length; i < l; i++) {
            var s = model.tableSeatList[i];
            s.setGraphicPosition(
              s.graphic.attr("fromTableX") + mx,
              s.graphic.attr("fromTableY") + my);
        }
        for (var i = 0, l = model.tableSeatAdditions.length; i < l; i++) {
            var s = model.tableSeatAdditions[i];
            s.setGraphicPosition({
              x:s.graphic.attr("fromTableX") + mx,
              y:s.graphic.attr("fromTableY") + my});
        }
        model.setGraphicPosition(mouseCX, mouseCY);
        
    },
    up = function() {
        var model = this.attr("model");
        model.seatSet.attr({
            stroke: colTableStroke 
        });
        
    };
    this.graphic.drag(move, start, up);
    this.graphic.mouseover(function(event) {
        this.animate({
            "stroke-width": 2,
            stroke: colTableSelectedStroke
        }, animationTime);
    });
    this.graphic.mouseout(function(event) {
        this.animate({
            "stroke-width": 1,
            stroke: colTableStroke
        }, animationTime);
    });
    this.ToJson = function() {
      var seatObject = [];
      for(var i=0,l=this.tableSeatList.length;i<l;i++) {
        seatObject.push(this.tableSeatList[i].ToJson());
      };
      return {
        type:"round",
        seatCount:this.tableSeatList.length,
        x:this.GetX(),
        y:this.GetY(),
        seatList: seatObject
      };
    };
},
MathHelper = {
  calculateAngle: function(center,point) {
    var twelveOClock = {
      x:center.x,
      y:center.y 
        - Math.sqrt(
              Math.abs(point.x - center.x) * Math.abs(point.x - center.x)
              + Math.abs(point.y - center.y) * Math.abs(point.y - center.y)
            )
    };
    return (2 * Math.atan2(point.y - twelveOClock.y, point.x - twelveOClock.x)) * 180 / Math.PI;
  },
  roundValue: function(val, rounding) {
    return Math.round(val/rounding) * rounding;
  }
}
Desk = function(x, y, rotation) {
    logEvent("Create Desk");
    this.GetX = Generic.PathGetX;
    this.GetY = Generic.PathGetY;
    this.setGraphicPositionBase = Generic.SetRelativeGraphicPosition;
    this.setGraphicPosition = function(x, y) {
      this.setGraphicPositionBase(x,y);
      this.rotationHandle.attr({cx:x + 50, cy:y + 50});
    };
    this.rotation = rotation;
    this.graphic = paper.path(shapes.desk);//
    this.graphic.attr({
      ox: 0,
      oy: 30,
      rotation: rotation,
      fill: colTable,
      stroke: colTableStroke,
      model: this
    });
    this.rotationHandle = paper.circle(0 + 60, 0 + 60, 10);
    this.rotationHandle.attr({
        rotation: rotation,
        fill: colTable,
        stroke: colTableStroke,
        model: this
    });
    var
    rotationstart = function(event) {
        logEvent("StartRotation Desk");
        var model = this.attr("model");
    },
    rotationmove = function(mx, my) {
        var model = this.attr("model"),
            mouseCX = this.attr("cx") + mx,
            mouseCY = this.attr("cy") + my,
            offset = 135,
            rounding = 22.5,
            calculateAngle = MathHelper.calculateAngle/*function(center,point) {
              var twelveOClock = {
                x:center.x,
                y:center.y 
                  - Math.sqrt(
                        Math.abs(point.x - center.x) * Math.abs(point.x - center.x)
                        + Math.abs(point.y - center.y) * Math.abs(point.y - center.y)
                      )
              };
              return (2 * Math.atan2(point.y - twelveOClock.y, point.x - twelveOClock.x)) * 180 / Math.PI;
            }*/,
            roundValue = MathHelper.roundValue/*function(val, rounding) {
              return Math.round(val/rounding) * rounding;
            }*/;
        var newANGLE = calculateAngle({x:model.GetX(), y:model.GetY()}, {x:mouseCX, y:mouseCY}) - offset;
        newANGLE = roundValue(newANGLE,rounding); 
        model.rotation = newANGLE;
        model.graphic.attr({transform:"T"+ model.GetX()+"," + model.GetY() +"R" + model.rotation});

    },
    rotationup = function() {
        logEvent("EndRotation Desk");
    };
    this.rotationHandle.drag(rotationmove, rotationstart, rotationup);
    this.rotationHandle.mouseover(function(event) {
        logEvent("Over Desk Rotation");
        this.animate({
            "stroke-width": 2,
            stroke: colTableSelectedStroke
        }, animationTime);
    });
    this.rotationHandle.mouseout(function(event) {
       logEvent("Out Desk Rotation");
       this.animate({
            "stroke-width": 1,
            stroke: colTableStroke
        }, animationTime);
    });
    
    this.setGraphicPosition(x, y);
    
    //this.width = 1 * 10;
    //this.widthWithChairs = this.width + 20;
    //this.graphic = paper.circle(x, y, this.width);
    this.seatSet = paper.set();
    this.seatSet.push(this.graphic);
    this.seatSet.push(this.rotationHandle);
    this.tableSeatList = [];
    this.addSeat = function() {
        /*var alpha = 360 / seatCount * this.tableSeatList.length,
            a = (90 - alpha) * Math.PI / 180,
            x = this.GetX() + this.widthWithChairs * Math.cos(a),
            y = this.GetY() - this.widthWithChairs * Math.sin(a),*/
        var mySeat = new Seat(x, y, rotation);
        this.tableSeatList.push(mySeat);
        this.seatSet.push(mySeat.graphic);
    };

    this.addSeat();
    
    var
    start = function(event) {
        logEvent("StartDrag Desk");
        var model = this.attr("model");
        this.ox = model.GetX();
        this.oy = model.GetY();
        for (var i = 0; i < model.tableSeatList.length; i++) {
            var s = model.tableSeatList[i];
            s.graphic.attr({
                  fromTableX: s.GetX(),
                  fromTableY: s.GetY()
            });

            
            
        }
        model.seatSet.attr({
            stroke: colSeatSelectedStroke  
        });
        this.attr("stroke", colTableSelectedStroke);
    },
    move = function(mx, my) {
        var model = this.attr("model"),
            mouseCX = this.ox + mx,
            mouseCY = this.oy + my;

        for (var i = 0; i < model.tableSeatList.length; i++) {
            var s = model.tableSeatList[i];
            s.setGraphicPosition(
            s.graphic.attr("fromTableX") + mx, s.graphic.attr("fromTableY") + my);
        }
        
        model.setGraphicPosition(mouseCX, mouseCY);
    },
    up = function() {
        logEvent("EndDrag Desk");
        var model = this.attr("model");
        model.seatSet.attr({
            stroke: colTableStroke 
        });
        
    };
    this.graphic.drag(move, start, up);
    this.graphic.mouseover(function(event) {
      this.animate({
            "stroke-width": 2,
            stroke: colTableSelectedStroke
        }, animationTime);
    });
    this.graphic.mouseout(function(event) {
      this.animate({
            "stroke-width": 1,
            stroke: colTableStroke
        }, animationTime);
    });
    this.ToJson = function() {
      var seatObject = [];
      for(var i=0,l=this.tableSeatList.length;i<l;i++) {
        seatObject.push(this.tableSeatList[i].ToJson());
      };
      return {
        type:"desk",
        rotation:this.rotation,
        x:this.GetX(),
        y:this.GetY(),
        seatList: seatObject
      };
    };
};

var SaveAll = function() {
  var SaveObject = {
    tables:[],
    guests:[]
  }
  for(var i=0,l=myTables.length;i<l;i++) {
    SaveObject.tables.push(myTables[i].ToJson());
  }
  for(var i=0,l=draggableGuests.length;i<l;i++) {
    if(!draggableGuests[i].seat) {
      SaveObject.guests.push(draggableGuests[i].ToJson());
    }
  }
  return SaveObject;
}
var LoadData = function(data) {
  var loadGuest = function(data) {
    return new Guest(data.name, data.x, data.y);
  },
  loadTable = function(data) {
    return new RoundTable(data.x, data.y, data.seatCount);
  },
  loadDesk = function(data) {
    return new Desk(data.x, data.y, data.rotation);
  };
  if(data.tables) {
    for (var i = 0, l = data.tables.length; i < l; i++) {
        if(data.tables[i].type === "desk") {
           myTables.push(loadDesk(data.tables[i]));
        } else if (data.tables[i].type === "table") {
           myTables.push(loadTable(data.tables[i]));
        }  
    }
  }
  if(data.guests) {
    for (var i = 0, l = data.guests.length; i < l; i++) {
        draggableGuests.push(loadGuest(data.guests[i]));
    }
  }
};
var MyToolBar; 
var Init = function() {
    MyToolBar = new ToolBar();
    //LoadData(exampleSave);
    
    //Create Tables & Seats
    myTables.push(new Desk(100, 100, 0));
    myTables.push(new Desk(200, 260, 180));
    myTables.push(new Desk(200, 260, 0));
    myTables.push(new Desk(200, 450, 0));
    
    for (var i = 20; i < 400; i = i + Math.floor(Math.random() * 30) + 200) {
        for (var j = 20; j < 400; j = j + Math.floor(Math.random() * 30) + 200) {
            myTables.push(new RoundTable(i, j, Math.floor(Math.random() * 12)));
        }
    }
    
    for (var p = 0; p < myGuests.length; p++) {
        draggableGuests.push(new Guest(myGuests[p].name, 100, 100 * (p + 1)));
    }
    
    logEvent("Finished Init");
}();

var exampleSave = {
  guests: [{name:"Fred Boodle", x:30, y:30}],
  tables: [{type:"desk",x:400, y:400, rotation: 90},
           {type:"desk",x:600, y:50, rotation: 0},
           {type:"table",x:200, y:200, seatCount: 5}]
}
