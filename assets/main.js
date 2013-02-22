// Put custom repo URL's in this object, keyed by repo name.
var repoUrls = {
};

// Put custom repo descriptions in this object, keyed by repo name.
var repoDescriptions = {
  'lib_mysqludf_stem': "MySQL UDF library providing stemming capability for a variety of languages using Dr. M.F. Porter's Snowball API"  
};

// Highlight functions for a repo.
var repoFunctions = {
  'lib_mysqludf_str': ['str_ucfirst(subject)', 'str_ucwords(subject)', 'str_numtowords(num)', 'str_rot13(subject)', 'str_translate(subject, src, dst)', '...'],
  'lib_mysqludf_preg': ['preg_replace(pattern, repl, subject)', 'preg_capture(pattern, subject, grp)', 'preg_rlike(pattern, subject)', 'preg_position(pattern, subject, grp)', 'preg_check(pattern)'],
  'lib_mysqludf_ta': ['Simple Moving Average', 'Exponential Moving Average', 'Relative Strength Index', 'True Range', 'Running Sum/Min/Max', 'Results N periods ago']
};

function repoUrl(repo) {
  return repoUrls[repo.name] || repo.html_url;
}

function repoDescription(repo) {
  return repoDescriptions[repo.name] || repo.description;
}

function repoFunction(repo) {
  return repoFunctions[repo.name];
}

function addRecentlyUpdatedRepo(repo) {
  var $item = $("<li>");

  var $name = $("<a>").attr("href", repo.html_url + '#readme').text(repo.name);
  $item.append($("<span>").addClass("name").append($name));

  var $time = $("<a>").attr("href", repo.html_url + "/commits").text(strftime("%h %e, %Y", repo.pushed_at));
  $item.append($("<span>").addClass("time").append($time));

  $item.append('<span class="bullet">&sdot;</span>');

  var $watchers = $("<a>").attr("href", repo.html_url + "/watchers").text(repo.watchers + " stargazers");
  $item.append($("<span>").addClass("watchers").append($watchers));

  $item.append('<span class="bullet">&sdot;</span>');

  var $forks = $("<a>").attr("href", repo.html_url + "/network").text(repo.forks + " forks");
  $item.append($("<span>").addClass("forks").append($forks));

  $item.appendTo("#recently-updated-repos");
}

function addRepo(repo) {
  var $item = $("<li>");
  var $link = $("<a>").attr("href", repoUrl(repo)).appendTo($item);
  $link.append($('<span>').text(repo.name.replace(/^lib_mysqludf_/, '').toUpperCase()));
  $link.append(' ');
  $link.append($('<small>').text(repo.description));
  $item.appendTo("#repos");
}

function addRepos(fn) {
  fn = fn || addRepo;

  var uri = "http://mysqludf-gitcache.jasny.net/repos.json";

  $.getJSON(uri, function (repos) {
    // Convert pushed_at to Date.
    $.each(repos, function (i, repo) {
      repo.pushed_at = new Date(repo.pushed_at);

      var weekHalfLife  = 1.146 * Math.pow(10, -9);

      var pushDelta    = (new Date) - Date.parse(repo.pushed_at);
      var createdDelta = (new Date) - Date.parse(repo.created_at);

      var weightForPush = 1;
      var weightForWatchers = 1.314 * Math.pow(10, 7);

      repo.hotness = weightForPush * Math.pow(Math.E, -1 * weekHalfLife * pushDelta);
      repo.hotness += weightForWatchers * repo.watchers / createdDelta;
    });

    // Sort by highest # of watchers.
    repos.sort(function (a, b) {
      if (a.hotness < b.hotness) return 1;
      if (b.hotness < a.hotness) return -1;
      return 0;
    });

    var length = 0;

    $.each(repos, function (i, repo) {
      if (!repo.name.match(/^lib_mysqludf_/)) return;

      length++;
      fn(repo);
    });

    $("#num-repos").text(length);

    // Sort by most-recently pushed to.
    repos.sort(function (a, b) {
      if (a.pushed_at < b.pushed_at) return 1;
      if (b.pushed_at < a.pushed_at) return -1;
      return 0;
    });

    $.each(repos.slice(0, 3), function (i, repo) {
      addRecentlyUpdatedRepo(repo);
    });
  });
}

function setMembers() {
  var uri = "http://mysqludf-gitcache.jasny.net/members.json";
  
  $.getJSON(uri, function (members) {
    $("#num-members").text(members.length);
  });
}
