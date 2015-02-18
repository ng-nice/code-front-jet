@font-face {
  font-family: "<%= fontName %>";
  src: url('<%= fontPath %><%= fontName %>.eot');
  src: url('<%= fontPath %><%= fontName %>.eot?#iefix') format('eot'),
    url('<%= fontPath %><%= fontName %>.woff') format('woff'),
    url('<%= fontPath %><%= fontName %>.ttf') format('truetype'),
    url('<%= fontPath %><%= fontName %>.svg#<%= fontName %>') format('svg');
}

%icon {
  font-family: "<%= fontName %>";
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-style: normal;
  font-variant: normal;
  font-weight: normal;
  // speak: none; // only necessary if not using the private unicode range (firstGlyph option)
  text-decoration: none;
  text-transform: none;
}

@function icon-char($filename) {
  $char: "";
<% _.each(glyphs, function(glyph) { %>
  @if $filename == <%= glyph.name %> {
    $char: "\<%= glyph.codepoint %>";
  }<% }); %>

  @return $char;
}

@mixin icon($filename, $insert: before) {
  &:#{$insert} {
    @extend %icon;
    content: icon-char($filename);
  }
}

<% _.each(glyphs, function(glyph) { %>.icon-<%= glyph.name %> {
  @include icon(<%= glyph.name %>);
}
<% }); %>
