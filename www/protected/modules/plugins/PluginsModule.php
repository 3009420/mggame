<?php

class PluginsModule extends CWebModule
{
	public function init()
	{
		// this method is called when the module is being created
		// you may place code here to customize the module or the application

		// import the module-level models and components
		$this->setImport(array(
			'plugins.models.*',
			'plugins.components.*',
			'plugins.modules.dictionary.components.*',
			'plugins.modules.import.components.*',
			'plugins.modules.export.components.*',
			'plugins.modules.weighting.components.*',
		));
    
    // loop through all active plugins and generate the list
    $this->setModules(array(
      'dictionary',
      'import',
      'export',
      'weighting',
    ));
	}

	public function beforeControllerAction($controller, $action)
	{
		if(parent::beforeControllerAction($controller, $action))
		{
			// this method is called before any module controller action is performed
			// you may place customized code here
			return true;
		}
		else
			return false;
	}
}