Shortly.LogoutView = Backbone.View.extend({
  className: 'logout',

  template: Templates['logout'],

  render: function() {
    console.log("Logout View Render function");
    this.$el.html(this.template());
    return this;
  }
});
