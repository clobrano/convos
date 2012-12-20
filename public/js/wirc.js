Structure.registerModule('Wirc', {
  base_url: window.location.href,
  test: function() { // poor mans test suite...
    console.log(Wirc.base_url);
    console.log(Wirc.Chat.makeTargetId('target', 1, '#bar'));

    Wirc.Notifier.show('', 'Running tests...', 'Yay!');
    Wirc.Chat.modifyChannelList({ joined: '#too_cool', cid: 1 });
    setTimeout(function() { Wirc.Chat.modifyChannelList({ parted: '#too_cool', cid: 1 }); }, 500);
    Wirc.Chat.modifyConversationlist({ nick: 'caveman', cid: 1 });
    setTimeout(function() { Wirc.Chat.displayUnread({ target: 'caveman', cid: 1 }); }, 300);

    console.log(JSON.stringify(Wirc.Chat.parseIrcInput({ timestamp: 1355957508, nick: 'caveman' })));
    console.log(JSON.stringify(Wirc.Chat.parseIrcInput({ timestamp: 1355957508, message: "\u0001ACTION what ever\u0001" })));
    console.log(JSON.stringify(Wirc.Chat.parseIrcInput({ timestamp: 1355957508, message: 'hello ' + Wirc.Chat.nick })));

    Wirc.Chat.window_has_focus = false;
    Wirc.Chat.receiveData({ data: { cid: 1, timestamp: 1355957508, nick: 'caveman', target: Wirc.Chat.target, message: "\u0001ACTION what ever\u0001" } });
    Wirc.Chat.receiveData({ data: { cid: 1, timestamp: 1355957508, nick: 'caveman', target: Wirc.Chat.target, message: 'hi!' } });
    Wirc.Chat.receiveData({ data: { cid: 1, timestamp: 1355957508, nick: 'caveman', target: Wirc.Chat.target, message: 'what up ' + Wirc.Chat.nick } });
    Wirc.Chat.receiveData({ data: { cid: 1, timestamp: 1355957508, old_nick: 'caveman', new_nick: 'cavewoman' } });
    Wirc.Chat.window_has_focus = true;
  }
});

Structure.registerModule('Wirc.Notifier', {
  show: function(icon, title, msg) {
    if(this.notifier) this.notifier.createNotification(icon || '', title, msg || '').show();
  },
  requestPermission: function() {
    webkitNotifications.requestPermission(function() {
      if(!webkitNotifications.checkPermission()) Wirc.Notifier.notifier = notifier;
    });
  },
  init: function() {
    if(!window.webkitNotifications) {
      // cannot show notifications
    }
    else if(webkitNotifications.checkPermission()) {
      // cannot run requestPermission() without a user action, such as mouse click or key down
      $(document).one('keydown', function() { Wirc.Notifier.requestPermission(); });
    }
    else {
      this.notifier = webkitNotifications;
    }
    return this;
  }
}); // End Wirc.Notify

Structure.registerModule('Wirc.Chat', {
  makeTargetId: function() {
    return 'target_' + $.map(arguments, function(v, i) { return v.toString().replace(/\W/g, ''); }).join('_');
  },
  modifyChannelList: function(data) { // TODO: return channel names
    var $channel = $('#' + this.makeTargetId(data.cid, data.joined || data.parted));

    if(data.parted)
      $channel.remove();

    if(data.joined && !$channel.length)
      $(tmpl('new_channel_template', data)).insertAfter('#connection_list_' + data.cid + ' .channel:last');
  },
  modifyConversationlist: function(data) {
    var $conversation = $('#' + this.makeTargetId(data.cid, data.nick));

    if(!$conversation.length)
      $(tmpl('new_conversation_template', data)).appendTo('#connection_list_' + data.cid);
  },
  displayUnread: function(data) {
    var $badge = $('#' + this.makeTargetId(data.cid, data.target) + ' .badge');
    $badge.text(parseInt($badge.text(), 10) + 1 ).show();
    if(data.highlight) $badge.addClass('badge-important');
  },
  print: function(data) {
    var at_bottom = $(window).scrollTop() + $(window).height() >= $('body').height() - 30; // need to calculate at_bottom before appending a new element
    var $messages = this.$messages;

    if(data.status) {
      if(data.status == this.status) return; // do not want duplicate status messages
      if(data.message) $messages.append(tmpl('server_status_template', data));
      this.status = data.status;
    }
    else if(data.new_nick && data.cid === this.connection_id) {
      $messages.append(tmpl('nick_change_template', data));
    }
    else if(data.nick !== this.nick && data.joined === this.target) {
      $messages.append( $(tmpl('nick_joined_template', data)) );
    }
    else if(data.template && data.target == this.target || data.nick == this.target) {
      $messages.append(tmpl(data.template, data));
    }

    if(at_bottom) {
      $('html, body').scrollTop($('body').height());
    }
  },
  parseIrcInput: function(d) {
    var data = $.parseJSON(d) || d;

    if(data.message) {
      var action = data.message.match(/^\u0001ACTION (.*)\u0001$/);
      if(action) data.message = action[1];
      data.highlight = data.message.match("\\b" + this.nick + "\\b") ? 1 : 0;
      data.message = data.message.replace(/</i, '&lt;').replace(/\b(\w{2,5}:\/\/\S+)/g, '<a href="$1" target="_blank">$1</a>');
      data.template = action ? 'action_message_template' : 'message_template';
    }

    if(data.timestamp) {
      data.timestamp = new Date(parseInt(data.timestamp * 1000, 10));
    }

    data.class_name = data.nick === this.nick                             ? 'me'
                    : data.highlight                                      ? 'focus'
                    : $('#chat_messages').find('li:last').hasClass('odd') ? 'even'
                    :                                                       'odd';

    return data;
  },
  receiveData: function(e) {
    if(window.console) console.log('[websocket] > ', e.data);
    var data = Wirc.Chat.parseIrcInput(e.data);

    // notification handling
    if(!self.window_has_focus) {
      if(data.highlight) {
        this.notifier.show('', 'New mention by ' + data.nick + ' in ' + data.target, data.message);
      }
      else if(data.target === this.nick) {
        this.notifier.show('', 'New message from ' + data.nick, data.message);
      }
      if(data.cid == this.connection_id && data.target == this.target) {
        document.title = 'New message in ' + this.target;
      }
    }

    // action handling
    if(data.joined || data.parted) {
      this.modifyChannelList(data);
    }
    else if(data.target) {
      if(data.target === this.nick && data.target !== this.target && this.target != this.nick) {
        this.modifyConversationlist(data);
      }
      if(data.target !== this.target) {
        this.displayUnread(data);
      }
    }
    else if(data.new_nick) {
      this.input.autoCompleteNicks(data);
      if(this.nick === data.old_nick) this.nick = this.new_nick;
    }

    this.print(data);
  },
  sendData: function(data) {
    try {
      this.websocket.send(JSON.stringify(data));
      if(window.console) console.log('[websocket] < ' + JSON.stringify(data));
    } catch(e) {
      if(window.console) console.log('[websocket] ! ' + e);
      this.print({ message: '[ws] < (' + data + '): ' + e });
    }
  },
  onScroll: function() {
    if(this.$history_indicator || $(window).scrollTop() !== 0) return;
    var self = this;
    var height_before_load = $('body').height();
    self.$history_indicator = $('<div class="alert alert-info">Loading previous conversations...</div>');
    self.$messages.before($history_indicator);
    $.get(Wirc.base_url + '/history/' + (++self.history_index), function(data) {
      var $li = $(data).find('#chat_messages li');
      if($li.length) {
        self.$messages.prepend($li);
        self.$history_indicator.remove();
        self.$history_indicator = false;
        $(window).scrollTop($('body').height() - height_before_load);
      }
      else {
        self.$history_indicator.removeClass('alert-info').text('End of conversation log.');
      }
    });
  },
  init: function($) {
    var self = this;
    var original_title = document.title;

    self.$messages = $('#chat_messages');
    self.connection_id = self.$messages.attr('data-cid');
    self.nick = self.$messages.attr('data-nick');
    self.target = self.$messages.attr('data-target');
    self.history_index = 0;
    self.notifier = Wirc.Notifier.init();

    self.websocket = new ReconnectingWebSocket(Wirc.base_url.replace(/^http/, 'ws') + '/socket');
    self.websocket.onopen = function() { self.sendData({ cid: self.connection_id, target: self.target }); };
    self.websocket.onmessage = self.receiveData;

    self.input = Wirc.Chat.Input.init($('#chat_input_field input[type="text"]'));
    self.input.submit = function(e) {
      self.sendData({ cid: self.connection_id, target: self.target, cmd: this.$input.val() });
      this.$input.val(''); // TODO: Do not clear the input field until echo is returned?
      return false;
    };
    $.each($('#chat_messages').attr('data-nicks').split(','), function(i, v) {
      if(v == this.nick) return;
      self.input.autoCompleteNicks({ new_nick: v.replace(/^\@/, '') });
    });

    $('html, body').scrollTop($('body').height());
    $(window).on('scroll', Wirc.Chat.onScroll);
    $(window).blur(function() { self.window_has_focus = false; });
    $(window).focus(function() { self.window_has_focus = true; self.input.focus(); document.title = original_title; });
    if(window.console) console.log('[Wirc.Chat.init] ', self);

    return self;
  }
}); /* End Structure.registerModule('Wirc.Chat') */

Structure.registerModule('Wirc.Chat.Input', {
  autocomplete: [
    '/join #',
    '/msg ',
    '/me ',
    '/nick ',
    '/part '
  ],
  autoCompleteNicks: function(data) {
    if(data.old_nick) {
      var needle = data.old_nick;
      this.autocomplete = $.grep(this.autocomplete, function(v, i) {
        return v != needle;
      });
    }
    if(data.new_nick) {
      this.autoCompleteNicks({ old_nick: data.new_nick });
      this.autocomplete.unshift(data.new_nick);
    }
  },
  tabbing: function(val) {
    var complete;

    if(val === false) {
      delete this.tabbed;
      return this;
    }
    if(typeof this.tabbed === 'undefined') {
      var offset = val.lastIndexOf(' ') + 1;
      var re = new RegExp('^' + val.substr(offset));

      this.autocomplete_offset = offset;
      this.matched = $.grep(this.autocomplete, function(v, i) {
                      return offset ? v.indexOf('/') === -1 && re.test(v) : re.test(v);
                     });
      this.tabbed = -1; // ++ below will make this 0 the first time
    }

    if(this.matched.length === 0) return val;
    if(++this.tabbed >= this.matched.length) this.tabbed = 0;
    complete = val.substr(0, this.autocomplete_offset) + this.matched[this.tabbed];
    if(complete.indexOf('/') !== 0 && val.indexOf(' ') === -1) complete +=  ': ';
    if(this.matched.length === 1) this.matched = []; // do not allow more tabbing on one hit

    return complete;
  },
  keydownCallback: function(e) {
    var self = this;
    return function(e) {
      switch(e.keyCode) {
        case 38: // up
          e.preventDefault();
          if(self.history.length === 0) return;
          if(self.history_index == self.history.length) self.initial_value = this.value;
          if(--self.history_index < 0) self.history_index = 0;
          this.value = self.history[self.history_index];
          break;

        case 40: // down
          e.preventDefault();
          if(self.history.length === 0) return;
          if(++self.history_index >= self.history.length) self.history_index = self.history.length;
          this.value = self.history[self.history_index] || self.initial_value || '';
          break;

        case 9: // tab
          e.preventDefault();
          this.value = self.tabbing(this.value);
          break;

        case 13: // return
          if(this.value.length === 0) return e.preventDefault(); // do not send empty commands
          self.history.push(this.value);
          self.history_index = self.history.length;
          break;

        default:
          self.tabbing(false);
          delete self.initial_value;
      }
    };
  },
  focus: function() {
    this.$input.focus();
  },
  init: function(input_selector) {
    var self = this;
    var $input = $(input_selector);

    self.history = [];
    self.history_index = 0;
    self.$input = $input;

    $input.keydown(self.keydownCallback());
    $input.parents('form').submit(function(e) { return self.submit(e); });
    $input.focus();

    return self;
  }
}); // End Wirc.Chat.Input

(function($) {
  $(document).ready(function() {
    Wirc.base_url = $('script[src$="jquery.js"]').get(0).src.replace(/\/js\/[^\/]+$/, '');
    $('#chat_messages').each(function() { setTimeout(function() { Wirc.Chat.init($); }, 100); });
  });
})(jQuery);

/*
 * Flash fallback for websocket
 *
if(!('WebSocket' in window)) {
  document.write([
    '<script type="text/javascript" src="' + Wirc.base_url + '/js/swfobject.js"></script>',
    '<script type="text/javascript" src="' + Wirc.base_url + '/js/FABridge.js"></script>',
    '<script type="text/javascript" src="' + Wirc.base_url + '/js/web_socket.js"></script>'
  ].join(''));
}
if(WebSocket.__initialize) {
  // Set URL of your WebSocketMain.swf here:
  WebSocket.__swfLocation = Wirc.base_url + '/js/WebSocketMain.swf';
}
*/
