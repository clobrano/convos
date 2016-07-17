(function() {
  Convos.Connection = function(attrs) {
    EventEmitter(this);
    this.id   = "";
    this.name = "";
    this.me   = {
      nick: ""
    };
    this.state = "disconnected";
    this.url   = "";
    this._api  = Convos.api;
    this.on("message", this._onMessage);
    this.on("state", this._onState);
    if (attrs) this.update(attrs);
  };

  var proto = Convos.Connection.prototype;

  proto.href = function(action) {
    return ["#connection", this.protocol(), this.name, action].join("/");
  };

  // Human readable version of state
  proto.humanState = function() {
    return this.state.ucFirst();
  };

  proto.nick = function() {
    return this.me.nick ? this.me.nick : this.url.parseUrl().query.nick || "";
  };

  // Return protocol (scheme) from url
  proto.protocol = function() {
    var protocol = this.url.match(/^(\w+):\/\//);
    return protocol ? protocol[1] : "unknown";
  };

  proto.notice = function(message) {
    this.emit("message", {
      from:    this.id,
      message: message,
      type:    "notice"
    });
  };

  // Remove this connection from the backend
  proto.remove = function(cb) {
    var self = this;
    this._api.removeConnection({connection_id: this.id}, function(err, xhr) {
      if (!err) {
        self.user.connections = self.user.connections.filter(function(c) {
          return c.id != self.id;
        });
      }
      cb.call(self, err);
    });
    return this;
  };

  // Get list of available rooms on server
  proto.rooms = function(cb) {
    var self = this;
    this._api.roomsByConnection(
      {
        connection_id: this.id
      }, function(err, xhr) {
        if (err) return cb.call(self, err, []);
        cb.call(self, err, xhr.body.rooms);
      }
    );
    return this;
  };

  // Write connection settings to server
  proto.save = function(cb) {
    var self = this;

    // It is currently not possible to specify "name"
    var attrs = {
      url: this.url
    };

    if (this.id) {
      this._api.updateConnection(
        {
          body:          attrs,
          connection_id: this.id
        }, function(err, xhr) {
          if (err) return cb.call(self, err);
          self.update(xhr.body);
          cb.call(self, err);
        }
      );
    } else {
      this._api.createConnection({
        body: attrs
      }, function(err, xhr) {
        if (err) return cb.call(self, err);
        self.update(xhr.body);
        self.user.connections.push(self);
        cb.call(self, err);
      });
    }
    return this;
  };

  proto.send = function(command, dialog) {
    var self = this;
    this._api.commandFromUser(
      {
        body: {
          command:       command,
          connection_id: this.id,
          dialog_id:     dialog ? dialog.id : ""
        }
      }, function(err, xhr) {
        var action = command.match(/^\/(\w+)/);
        if (err) {
          self.emit("message", {
            type:    "error",
            message: 'Could not send "' + command + '": ' + err[0].message
          });
        } else if (action) {
          var handler = "_on" + action[1].toLowerCase().ucFirst() + "Event";
          return self[handler] ? self[handler](xhr.body) : console.log("No handler for " + handler);
        }
      }
    );
    return this;
  };

  proto.update = function(attrs) {
    var self = this;
    Object.keys(attrs).forEach(function(n) {
      self[n] = attrs[n];
    });
  };

  proto._onCloseEvent = function(data) {
    this.user.refreshDialogs(function(err) {
      var dialog = this.dialogs[0];
      if (err) return;
      if (!dialog) return;
      this.dialogs.forEach(function(d) {
        d.active(d.id == dialog.id ? true : false);
      });
    });
  };

  proto._onJoinEvent = function(data) {
    this.user.refreshDialogs(function(err) {
      if (err) return;
      this.dialogs.forEach(function(d) {
        d.active(d.id == data.id ? true : false);
      });
    });
  };

  proto._onJEvent    = proto._onJoinEvent;
  proto._onPartEvent = proto._onCloseEvent;

  proto._onMessage = function(data) {
    var self   = this;
    var dialog = this.user.dialogs.filter(function(d) {
      var c = d.connection;
      return c && c.id == self.id && d.active();
    })[0];
    data.from = this.id;
    if (dialog) dialog.emit("message", data);
  };

  proto._onState = function(data) {
    switch (data.type) {
      case "connection":
        var msg = data.state + '"';
        this.state = data.state;
        msg += data.message ? ': ' + data.message : ".";
        this.notice('Connection state changed to "' + msg);
      case "me":
        this.me.nick = data.nick;
        break;
      case "nick_change":
        this.user.dialogs.forEach(function(d) {
          if (d.connection_id == data.connection_id) d.emit("state", data);
        });
        break;
      case "part":
        this.user.dialogs.forEach(function(d) {
          if (d.connection_id == data.connection_id) d.emit("state", data);
        });
        break;
      default:
        console.log(data);
    }
  };

  proto._onWhoisEvent = function(data) {
    var channels = Object.keys(data.channels).sort();
    data.message = data.nick;

    if (data.idle_for) {
      data.message += " has been idle for " + data.idle_for + " seconds in ";
    } else {
      data.message += " is active in ";
    }

    while (channels.length) {
      var name = channels.shift();
      var sep  = channels.length == 1 ? " and " : channels.length ? ", " : ".";
      data.message += name + "" + sep;
    }

    this.notice(data.message);
  };
})();
