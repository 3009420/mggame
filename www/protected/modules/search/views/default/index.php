<?php
    $form = $this->beginWidget('GxActiveForm', array(
    'action' => Yii::app()->createUrl($this->route),
    'method' => 'get',
)); ?>

<div class="search-form" style="display: block;">
    <?php $this->renderPartial('_search', array(
        'model' => $model,
        'institutions' => $institutions
    )); ?>
</div><!-- search-form -->


<?php

function generateImage($data)
{
    $media = CHtml::image(MGHelper::getMediaThumb($data->institution->url, $data->mime_type, $data->name), $data->name);
    return $media;
}
function generateImageURL ($data)
{
    $url = MGHelper::getMediaThumb($data->institution->url, $data->mime_type, $data->name);
    return $url;
}

function totalItemsFound($provider)
{
    $iterator = new CDataProviderIterator($provider);
    $i = 0;
    foreach($iterator as $tmp) {
        $i++;
    }
    return $i;
}

$mediaResults = $model->search(true);
$total = count($mediaResults->getData());
$items = $mediaResults->getData();
global $relatedMedia;
$relatedMedia = array();
foreach($items as $key=>&$data){
    $relatedMedia[$data->id] = array();
    $index = $key+1;
    if($index>$total) $index = 0;
    for($i=0;$i<8;$i++){
        $relate = array("id"=>$items[$index]->id,
                        "thumb"=>MGHelper::getMediaThumb($items[$index]->institution->url,$items[$index]->mime_type,$items[$index]->name));
        array_push($relatedMedia[$data->id],$relate);
        $index++;
        if($index>$total) $index = 0;
    }
}

echo '
    <div class="main_content box">';
$options = array ('10' => '10', '15' => '15', '20'=>'20', '25'=>'25' );
$sorterOptions = array('relevance' => 'Relevance', 'a_z' => 'A-Z', 'z_a'=>'Z-A');
$this->widget('zii.widgets.CListView', array(
    'dataProvider'=>$mediaResults,
    'itemView'=>'_viewSearch',   // refers to the partial view named '_viewSearch'
    'ajaxUpdate'=>false,
    'enablePagination'=>true,
   // 'template'=>"{summary}<div>{sorter}\n{pager}</div>{items}\n<div>{sorter}\n{pager}</div>", //pager on top
    'template'=>"<div id = \"levelOneHolder\">{summary}<div class = \"itemsPerPage\">Items per page: " . CHtml::dropDownList('Custom[items_per_page]', $setItemsPerPage, $options) . "</div>" . 'Sort by: ' . CHtml::dropDownList('Custom[alphabetical_sort]', $setAlphabeticalOrder, $sorterOptions) ."{pager}</div>{items}", //pager on top
    'summaryText'=>" ",

));
echo '</div>';
$this->endWidget();

echo "<div id=\"totalItemsFound\">";
$itemsFound =  totalItemsFound($mediaResults);
if($itemsFound != 0) echo  'Your search ' .   "<div id=\"putFor\"> </div>"  .' '. "<div id=\"searchedValue\"> </div>" . ' returned ' . $itemsFound . ' results.';
echo "</div>";
?>

<script id="template-image_description" type="text/x-jquery-tmpl">
    <div class="delete right">X</div>
    <div class="image_div" >
        <img src="${imageFullSize}" />
    </div>
    <div class="group text_descr">
       <div><strong>${collection} </strong></div>
        <div><strong><a href=${instWebsite} target="_blank">${institution}</strong></a></div>
        <div>Other media that may interest you:</div>
        <div id="related_items" class="group">
            {{each related}}
            <div class="item">
                <img src="${thumbnail}" onclick="$('#${id}').trigger('click');" style="cursor: pointer;"/>
            </div>
            {{/each}}
        </div>
        <div id="tags">
            <!--{{each tags}}
            ${tag}
            {{/each}}-->
            ${tags}
        </div>
    </div>
</script>

<script id="template-video_description" type="text/x-jquery-tmpl">
    <div class="delete right">X</div>
    <div class="image_div">
        <video class="video" controls preload poster="${videoPoster}" width="480" height="320">
            <source src="${videoWebm}"></source>
            <source src="${videoMp4}"></source>
        </video>
    </div>
    <div class="group text_descr">
        <br />
        <div><strong>${collection} </strong></div>
        <div><strong><a href=${instWebsite} target="_blank">${institution}</strong></a></div>
        <div>Other media that may interest you:</div>
        <div id="related_items" class="group">
            {{each related}}
            <div class="item">
                <img src="${thumbnail}" onclick="$('#${id}').trigger('click');" style="cursor: pointer;"/>
            </div>
            {{/each}}
        </div>
        <div id="tags">
            <!--{{each tags}}
            ${tag}
            {{/each}}-->
            ${tags}
        </div>
    </div>
</script>
<script id="template-audio_description" type="text/x-jquery-tmpl">
    <div class="delete right">X</div>
    <div class="image_div">
        <audio class="audio" controls preload>
            <source src="${audioMp3}"></source>
            <source src="${audioOgg}"></source>
        </audio>
    </div>
    <div class="group text_descr">
        <br />
        <div><strong>${collection} </strong></div>
        <div><strong><a href=${instWebsite} target="_blank">${institution}</strong></a></div>
        <div>Other media that may interest you:</div>
        <div id="related_items" class="group">
            {{each related}}
            <div class="item" >
                <img src="${thumbnail}" onclick="$('#${id}').trigger('click');" style="cursor: pointer;"/>
            </div>
            {{/each}}
        </div>
        <div id="tags">
            <!--{{each tags}}
            ${tag}
            {{/each}}-->
            ${tags}
        </div>
    </div>
</script>