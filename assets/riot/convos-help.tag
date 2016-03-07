<convos-help>
  <div class="row">
    <div class="col s12">
      <div class="actions">
        <a href="#chat"><i class="material-icons">close</i></a>
      </div>
      <h5 if={!isTouchDevice}>Shortcuts</h5>
      <p if={!isTouchDevice}>These shortcuts are not yet implemented.</p>
      <dl if={!isTouchDevice}>
        <dt>shift+enter</dt>
        <dd>Shift focus between chat input and dialog sidebar.</dd>
        <dt>tab (When writing a message)</dt>
        <dd>Will autocomplete a command, nick or channel name.</dd>
      </dl>
      <h5>Available commands</h5>
      <p>Commands are not yet supported.</p>
      <dl>
      <dl>
        <dt><a href="#autocomplete:/close">/close [&lt;nick&gt;]</a></dt>
        <dd>Close conversation with nick, defaults to current active.</dd>
        <dt><a href="#autocomplete:/join">/join &lt;#channel&gt;</a></dt>
        <dd>Join channel and open up a chat window</dd>
        <dt><a href="#autocomplete:/kick">/kick &lt;nick&gt;</a></dt>
        <dd>Kick a user from the current channel</dd>
        <dt><a href="#autocomplete:/me">/me &lt;message&gt;</a></dt>
        <dd>Send message as an action.</dd>
        <dt><a href="#autocomplete:/msg">/msg &lt;nick&gt;</a></dt>
        <dd>Send a direct message to nick</dd>
        <dt><a href="#autocomplete:/names">/names</a></dt>
        <dd>Retrieve nick list.</dd>
        <dt><a href="#autocomplete:/nick">/nick &lt;nick&gt;</a></dt>
        <dd>Change your wanted nick.</dd>
        <dt><a href="#autocomplete:/part">/part &lt;#channel&gt;</a></dt>
        <dd>Leave channel, and close window</dd>
        <dt><a href="#autocomplete:/query">/query &lt;nick&gt;</a></dt>
        <dd>Open up a new chat window with nick</dd>
        <dt><a href="#autocomplete:/reconnect">/reconnect</a></dt>
        <dd>Restart the current connection.</dd>
        <dt><a href="#autocomplete:/say">/say &lt;message&gt;</a></dt>
        <dd>Used when you want to send a message starting with "/".</dd>
        <dt><a href="#autocomplete:/topic">/topic &lt;#channel&gt; [&lt;new topic&gt;]</a></dt>
        <dd>Show current topic, or set a new one</dd>
        <dt><a href="#autocomplete:/whois">/whois &lt;nick&gt;</a></dt>
        <dd>Show information about a user</dd>
      </dl>
      </dl>
      <h5>Resources</h5>
      <ul>
        <li><a target="_blank" href="http://convos.by">Project homepage</a></li>
        <li><a target="_blank" href="https://github.com/Nordaaker/convos/issues">Bug/issue tracker</a></li>
        <li><a target="_blank" href="https://github.com/Nordaaker/convos">Source code</a></li>
      </ul>
      <p>
        It is also possible to chat with us in the "#convos" channel on
        <a target="_blank" href="http://freenode.net/">irc.freenode.net</a>.
      </p>
    </div>
  </div>
  <script>
  this.isTouchDevice = window.isTouchDevice;
  </script>
</convos-help>