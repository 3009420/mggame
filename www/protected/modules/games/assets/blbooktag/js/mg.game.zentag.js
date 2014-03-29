MG_GAME_ZENTAG = function ($) {
    return $.extend(MG_GAME_API, {
        wordField: null,
        playOnceMoveOnFinalScreenWaitingTime: 15000, // milliseconds
        submitButton: null,
        passButton: null,
        // The magic string that we use to signal that we're passing on
        // this turn.
        passString: "__PASSONTHISTURN__",
        // The magic string, after being munged by our internal filters.
        passStringFiltered: "passonthisturn",

        /*
         * initialize the game. called from inline script generated by the view
         */
        init: function (options) {
            var settings = $.extend(options, {
                ongameinit: MG_GAME_ZENTAG.ongameinit
            });

            MG_GAME_ZENTAG.wordField = $("#words");

            // TODO: Refactor this part
            // allowed keys, in game
            $("#words").bind("keydown", function(event) {
                //console.log(event.which);
                if (event.shiftKey) { // When pressing shift, only allow these
                    return (
                        (event.which >= 97 && event.which <= 122) || // a-z
                        (event.which >= 65 && event.which <= 90) // A-Z
                    );
                }
                else {
                    return ( 
                        (event.which >= 97 && event.which <= 122) ||// a-z
                        (event.which >= 65 && event.which <= 90) || // A-Z
                        (event.which >= 48 && event.which <= 57) || // 0-9
                        event.which === 8 || event.which == 13 || event.which == 32 || // Backspace, Enter, space
                        event.which == 188 || event.which == 222 || // comma, apostrophe
                        event.which == 109 || event.which == 189 // dash, for different browsers
                    );
                }
            });

            // submit on enter
            MG_GAME_ZENTAG.wordField.focus().keydown(function (event) {
                if (event.keyCode == 13) {
                    MG_GAME_ZENTAG.onsubmit();
                    return false;
                }
            });

            MG_GAME_ZENTAG.submitButton = $("#button-play").click(MG_GAME_ZENTAG.onsubmit);
            // TRY to get pass button to submit correct value.
            MG_GAME_ZENTAG.passButton = $("#button-pass").click(MG_GAME_ZENTAG.onpass);

            MG_GAME_API.game_init(settings);
        },

        /*
         * display games turn
         */
        renderTurn: function (response, score_info, turn_info, licence_info, more_info, words_to_avoid) {
            $("#stage, #logo").hide();

            $("#scores").html("");
            $("#template-scores").tmpl(score_info).appendTo($("#scores"));
            if (!MG_GAME_ZENTAG.game.user_authenticated) {
                $("#scores .total_score").remove();
            }

            $("#image_container").html("");
            $("#template-turn").tmpl(turn_info).appendTo($("#image_container"));

            $("a[rel='zoom']").fancybox({overlayColor: '#000'});
            $(".how-to-play").fancybox({overlayColor: '#000', content: $('#template-game-description').tmpl({})});
            $("img.magnify").on("click", function() {
              $("a[rel='zoom']").click();
            });
            $("#wikipedia .blue-tab").on("click", function() {
              console.log("wamp wamp");
              $(this).closest(".tab-container").toggleClass("open");
            });

            $("#stage, #logo").fadeIn(1000, function () {
                MG_GAME_ZENTAG.busy = false;
                MG_GAME_ZENTAG.wordField.focus();
            });
        },

        /*
         * display the final turn
         */
        renderFinal: function (response, score_info, turn_info, licence_info, more_info) {
            $("#stage, #logo").hide();

            $('#game_description').hide();
            $('#passing').hide();
            $("img.magnify").hide();

            //$("#scores").html("");

            $("#fieldholder").html("");
            $("#template-final-info").tmpl(score_info).appendTo($("#fieldholder"));
            if (score_info.tags_new !== undefined && score_info.tags_new != "")
                $("#template-final-tags-new").tmpl(score_info).appendTo($("#fieldholder"));

            if (score_info.tags_matched !== undefined && score_info.tags_matched != "")
                $("#template-final-tags-matched").tmpl(score_info).appendTo($("#fieldholder"));

            $("#image_container").html("");
            if (MG_GAME_ZENTAG.game.play_once_and_move_on == 1) {
                $("#template-final-info-play-once").tmpl(score_info).appendTo($("#fieldholder"));
                $("#template-final-summary-play-once").tmpl(turn_info).appendTo($("#image_container"));
                $("#box1").hide();
                window.setTimeout(function () {
                    window.location = score_info.play_once_and_move_on_url;
                }, MG_GAME_ZENTAG.playOnceMoveOnFinalScreenWaitingTime);

                var updateRemainingTime = function () {
                    MG_GAME_ZENTAG.playOnceMoveOnFinalScreenWaitingTime -= 1000;
                    if (MG_GAME_ZENTAG.playOnceMoveOnFinalScreenWaitingTime >= 1) {
                        $('#remainingTime').text(MG_GAME_ZENTAG.playOnceMoveOnFinalScreenWaitingTime / 1000);
                        window.setTimeout(updateRemainingTime, 1000);
                    }
                }
                window.setTimeout(updateRemainingTime, 1000);

            } else {
                $("#template-final-summary").tmpl(turn_info).appendTo($("#image_container"));
            }
            $("a[rel='zoom']").fancybox({overlayColor: '#000'});

            MG_GAME_API.releaseOnBeforeUnload();
            MG_GAME_ZENTAG.submitButton.addClass("again").unbind("click");
            MG_GAME_ZENTAG.submitButton.find("a").text("Play Again?").attr("href", window.location.href.replace(/#$/, ''));
            MG_GAME_ZENTAG.passButton.hide();

            $("#stage, #logo").fadeIn(1000, function () {
                MG_GAME_ZENTAG.busy = false;
                MG_GAME_ZENTAG.wordField.focus();
            });
        },

        /*
         * evaluate each response from /api/games/play calls (POST or GET)
         */
        onresponse: function (response) {
            MG_GAME_API.curtain.hide();

            MG_GAME_ZENTAG.turn++;
            MG_GAME_ZENTAG.turns.push(response.turn);

            var more_info = {};
            if ($.trim(MG_GAME_ZENTAG.game.more_info_url) != "")
                var more_info = {url: MG_GAME_ZENTAG.game.more_info_url, name: MG_GAME_ZENTAG.game.name};

            if (MG_GAME_ZENTAG.turn > MG_GAME_ZENTAG.game.turns) { // render final result
                var licence_info = [];

                var taginfo = {
                    'tags_new': {
                        tags: [],
                        score: 0
                    },
                    'tags_matched': {
                        tags: [],
                        score: 0
                    }
                };

                // prepare needed data for the final screen
                if (MG_GAME_ZENTAG.turns.length) { // extract scoring and licence info
                    for (i_turn in MG_GAME_ZENTAG.turns) {
                        var turn = MG_GAME_ZENTAG.turns[i_turn];
                        for (i_img in turn.tags.user) { //scores
                            var image = turn.tags.user[i_img];
                            for (i_tag in image) {
                                // PASSING: If we find the passing tag, we just skip it.
                                if (i_tag == MG_GAME_ZENTAG.passStringFiltered) {
                                    continue;
                                }
                                var tag = image[i_tag];
                                switch (tag.type) {
                                    case "new":
                                        taginfo.tags_new.tags.push(i_tag);
                                        taginfo.tags_new.score += tag.score;
                                        break;

                                    case "match":
                                        taginfo.tags_matched.tags.push(i_tag);
                                        taginfo.tags_matched.score += tag.score;
                                        break;
                                }
                            }
                        }

                        for (var scope in taginfo) {
                            var o_scope = taginfo[scope];
                            var tmp = {};
                            var tmp2 = [];
                            if (o_scope.tags !== undefined && o_scope.tags.length) {
                                for (var index in o_scope.tags) {
                                    if (o_scope.tags[index] in tmp) {
                                        tmp[o_scope.tags[index]]++;
                                    } else {
                                        tmp[o_scope.tags[index]] = 1;
                                    }
                                }
                                for (var tag in tmp) {
                                    if (tmp[tag] > 1) {
                                        tmp2.push(tag + ' (' + tmp[tag] + ')');
                                    } else {
                                        tmp2.push(tag);
                                    }
                                }
                                taginfo[scope].scoreinfo = $.trim(tmp2.join(", "));
                            }
                        }

                        if (turn.licences.length) {
                            for (licence in turn.licences) { // licences
                                var found = false;
                                for (l_index in licence_info) {
                                    if (licence_info[l_index].id == turn.licences[licence].id) {
                                        found = true;
                                        break;
                                    }
                                }

                                if (!found)
                                    licence_info.push(turn.licences[licence]);
                            }
                        }
                    }
                }

                //score box
                var score_info = {
                    user_name: MG_GAME_ZENTAG.game.user_name,
                    user_score: MG_GAME_ZENTAG.game.user_score,
                    current_score: response.turn.score,
                    user_num_played: MG_GAME_ZENTAG.game.user_num_played,
                    turns: MG_GAME_ZENTAG.game.turns,
                    current_turn: MG_GAME_ZENTAG.turn,
                    tags_new: taginfo.tags_new.scoreinfo,
                    tags_new_score: taginfo.tags_new.score,
                    tags_matched: taginfo.tags_matched.scoreinfo,
                    tags_matched_score: taginfo.tags_matched.score
                };

                if (MG_GAME_ZENTAG.game.play_once_and_move_on == 1) {
                    if (MG_GAME_ZENTAG.game.play_once_and_move_on_url == "")
                        MG_GAME_ZENTAG.game.play_once_and_move_on_url = "/";

                    score_info.remainingTime = (MG_GAME_ZENTAG.playOnceMoveOnFinalScreenWaitingTime / 1000);
                    score_info.play_once_and_move_on_url = MG_GAME_ZENTAG.game.play_once_and_move_on_url;

                    // turn info == image
                    var turn_info = {
                        url: MG_GAME_ZENTAG.turns[0].medias[0].scaled,
                        url_full_size: MG_GAME_ZENTAG.turns[0].medias[0].full_size,
                        licence_info: MG_GAME_API.parseLicenceInfo(MG_GAME_ZENTAG.turns[0].licences)
                    };

                } else {
                    // turn info == image
                    var turn_info = {
                        url_1: MG_GAME_ZENTAG.turns[0].medias[0].final_screen,
                        url_full_size_1: MG_GAME_ZENTAG.turns[0].medias[0].full_size,
                        licence_info_1: MG_GAME_API.parseLicenceInfo(MG_GAME_ZENTAG.turns[0].licences),
                        url_2: MG_GAME_ZENTAG.turns[1].medias[0].final_screen,
                        url_full_size_2: MG_GAME_ZENTAG.turns[1].medias[0].full_size,
                        licence_info_2: MG_GAME_API.parseLicenceInfo(MG_GAME_ZENTAG.turns[1].licences),
                        url_3: MG_GAME_ZENTAG.turns[2].medias[0].final_screen,
                        url_full_size_3: MG_GAME_ZENTAG.turns[2].medias[0].full_size,
                        licence_info_3: MG_GAME_API.parseLicenceInfo(MG_GAME_ZENTAG.turns[2].licences),
                        url_4: MG_GAME_ZENTAG.turns[3].medias[0].final_screen,
                        url_full_size_4: MG_GAME_ZENTAG.turns[3].medias[0].full_size,
                        licence_info_4: MG_GAME_API.parseLicenceInfo(MG_GAME_ZENTAG.turns[3].licences)
                    }
                }

                MG_GAME_API.renderFinal(response, score_info, turn_info, licence_info, more_info);

            } else {
                // show next turn

                //score box
                var score_info = {
                    user_name: MG_GAME_ZENTAG.game.user_name,
                    user_score: MG_GAME_ZENTAG.game.user_score,
                    current_score: response.turn.score,
                    user_num_played: MG_GAME_ZENTAG.game.user_num_played,
                    turns: MG_GAME_ZENTAG.game.turns,
                    current_turn: MG_GAME_ZENTAG.turn
                };

                var licence_info = response.turn.licences;

                $("#words_to_avoid").hide();
                var words_to_avoid = []
                if (response.turn.wordstoavoid) {
                    for (media in response.turn.wordstoavoid) {
                        for (tag in response.turn.wordstoavoid[media]) {
                            words_to_avoid.push(response.turn.wordstoavoid[media][tag]);
                        }
                    }
                    if (words_to_avoid.length)
                        $("#words_to_avoid").show();
                }

                // turn info == image
                var turn_info = {
                    url: response.turn.medias[0].scaled,
                    url_full_size: response.turn.medias[0].full_size,
                    licence_info: MG_GAME_API.parseLicenceInfo(licence_info)
                }

                MG_GAME_API.renderTurn(response, score_info, turn_info, licence_info, more_info, words_to_avoid);
            }
        },


        /*
         * on callback for the submit button
         */
        onsubmit: function () {
            if (!MG_GAME_ZENTAG.busy) {
                var tags = $.trim(MG_GAME_ZENTAG.wordField.val());

                // TODO: Refactor this part
                // replace multiple whitespaces with a single space
                // already done for db submissions, so not really needed here
                //tags = tags.replace(/\s{2,}/g, ' '); 
                // just to be safe, strip the special chars if still present
                // forbid: `~!@#$%^&*()_=+{}|<>./?;:[]\"
                // allowed: '-
                tags = tags.replace(/[`~!@#$%^&*()_=+{}|<>./?;:\[\]\\"]/g, ""); 

                // Lowercase the tags. Means that the db will have all lowercase data
                tags = tags.toLowerCase();
                //console.log(tags);

                if (tags == "") {
                    // val filtered for all white spaces (trim)
                    MG_GAME_ZENTAG.error("<h1>Ooops</h1><p>Please enter at least one word</p>");
                } else {

                    // text entered
                    MG_GAME_API.curtain.show();
                    MG_GAME_ZENTAG.busy = true;

                    // send ajax call as POST request to validate a turn
                    MG_API.ajaxCall('/games/play/gid/' + MG_GAME_API.settings.gid, function (response) {
                        if (MG_API.checkResponse(response)) {
                            MG_GAME_ZENTAG.wordField.val("");
                            MG_GAME_ZENTAG.onresponse(response);
                        }
                    }, {
                        type: 'post',
                        data: { // this is the data needed for the turn
                            turn: MG_GAME_ZENTAG.turn,
                            wordstoavoid: MG_GAME_ZENTAG.turns[MG_GAME_ZENTAG.turn - 1].wordstoavoid,
                            played_game_id: MG_GAME_ZENTAG.game.played_game_id,
                            'submissions': [
                                {
                                    media_id: MG_GAME_ZENTAG.turns[MG_GAME_ZENTAG.turn - 1].medias[0].media_id,
                                    tags: tags
                                }
                            ]
                        }
                    });
                }
            }
            return false;
        },


        /*
         * on callback for the PASS button
         */
        onpass: function () {
            if (!MG_GAME_ZENTAG.busy) {
                var tags = MG_GAME_ZENTAG.passString;

                // text entered
                MG_GAME_API.curtain.show();
                MG_GAME_ZENTAG.busy = true;

                // send ajax call as POST request to validate a turn
                MG_API.ajaxCall('/games/play/gid/' + MG_GAME_API.settings.gid,
                    function (response) {
                        if (MG_API.checkResponse(response)) {
                            MG_GAME_ZENTAG.wordField.val("");
                            MG_GAME_ZENTAG.onresponse(response);
                        }
                    }, {
                        type: 'post',
                        data: { // this is the data needed for the turn
                            turn: MG_GAME_ZENTAG.turn,
                            wordstoavoid: MG_GAME_ZENTAG.turns[MG_GAME_ZENTAG.turn - 1].wordstoavoid,
                            played_game_id: MG_GAME_ZENTAG.game.played_game_id,
                            'submissions': [
                                {
                                    media_id: MG_GAME_ZENTAG.turns[MG_GAME_ZENTAG.turn - 1].medias[0].media_id,
                                    tags: tags
                                }
                            ]
                        }
                    });
            }
            return false;
        },

        searchWikipedia: function() {
          //http://en.wikipedia.org/w/api.php?action=query&list=search&srwhat=text&format=json&srsearch=rap
        },

        /*
         * this method appears to be not used
         */
        submit: function () {
            MG_API.ajaxCall('/games/play/gid/' + MG_GAME_API.settings.gid, function (response) {
                if (MG_API.checkResponse(response)) { // we have to check whether the API returned a HTTP Status 200 but still json.status == "error" response
                    MG_GAME_API.game = $.extend(MG_GAME_API.game, response.game);
                    MG_GAME_API.settings.ongameinit(response);
                }
            });
        },

        /*
         * process /api/games/play get request responses
         */
        ongameinit: function (response) {
            MG_GAME_ZENTAG.onresponse(response);
        }
    });
}(jQuery);


