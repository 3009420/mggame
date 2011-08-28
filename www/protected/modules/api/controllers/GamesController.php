<?php

class GamesController extends ApiController {
  
  public function filters() {
    return array( // add blocked IP filter here
        'throttle',
        'IPBlock',
        'APIAjaxOnly', // custom filter defined in this class accepts only requests with the header HTTP_X_REQUESTED_WITH === 'XMLHttpRequest'
        'accessControl',
        'sharedSecret', // the API is protected by a shared secret this filter ensures that it is regarded 
    );
  }
  
  /**
   * Defines the access rules for this controller
   */  
  public function accessRules() {
    return array(
      array('allow',
        'actions'=>array('index', 'scores', 'play', 'partner'),
        'users'=>array('*'),
        ),
      array('deny', 
        'users'=>array('*'),
        ),
      );
  }
  
  /**
   * Via this method call the user can request a partner for a game
   */
  public function actionPartner($unique_id) {
    if (Yii::app()->getRequest()->getIsGetRequest()) {
      $data = array();
      $data['status'] = "ok";
      $data['partner'] = array();
      $this->sendResponse($data);  
    } else {
      throw new CHttpException(400, Yii::t('app', 'Your request is invalid.'));
    } 
  }
  
  /**
   * This 
   */
  public function actionPlay($game) {
    $game_model = GamesModule::loadGame($game);
    if($game_model) {
      if (Yii::app()->getRequest()->getIsPostRequest()) {
        $this->_playPost($game_model);
      } else {
        $this->_playGet($game_model);
      }
    } else {
      throw new CHttpException(400, Yii::t('app', 'Your request is invalid.'));
    }
  }
  
  /**
   * Processes the GET request of the play method call xxx
   * 
   * Returned JSON
   * {
   *  status: 'ok|error',
   *  errors: {"field":["Error Message"]}, // if status == error
   *  game: {
   *    // the following fields are available in all games
   *    unique_id : '',
   *    played_game_id : '', // as a user can play more than one game per session we have to track a played game id
   *    name : '',
   *    description : '',
   *    more_info_url : '',
   *    base_url : '',
   *    'play_once_and_move_on' => '0|1',
   *    'turns' => '4',
   *    'user_name' => null or 'user name' // if the user is authenticated
   *    'user_score' => 0 or x // if the user is authenticated 
   *    'user_authentiated => false/true // true if user is authenticated 
   *    //a game could have more fields
   *  },
   *  turn : {
   *    score : 0, // numeric value the current score
   *    turn : 1, // the active game session's current turn 
   *    // the following fields are available in all games
   *    images : [{
   *      // all urls are relative to game.base_url
   *      url_full_size : '',
   *      url_scaled : '',
   *      url_thumb : '',
   *      licence : 'name of licence that can be found in turn.licences',
   *    }, {...}],
   *    licences : [{
   *      // 
   *      name : '',
   *      description : '',
   *    }, {...}],   
   *    
   *    // the turn can have further elements created by plugins or similar. e.g
   *    wordsToAvoid : ["dog", "house", "car"],
   *    
   *  }
   * }
   *
   */
  private function _playGet($game_model) {
    $data = array();
    $data['status'] = "ok";
    $data['game'] = $game_model;
    $this->sendResponse($data);
  }
  
  /**
   * Processes the POST request of the play method call xxx
   */
  private function _playPost($game_model) {
    
  }
  
  /**
   * This action returns a list of all games available in the system xxx
   */
  public function actionIndex() {
    if(Yii::app()->getRequest()->getIsAjaxRequest()) {
      $data = array();
      $data['status'] = "ok";
      $data['games'] = GamesModule::listActiveGames();
      $this->sendResponse($data);  
    } else {
      parent::actionIndex();
    }
  }
  
  /**
   * Returns the top 10 list of scores of all users xxx
   * 
   */
  public function actionScores() {
    $data = array();
    $data['status'] = "ok";
    $data['scores'] = array(); // 
    $this->sendResponse($data);
  }
}