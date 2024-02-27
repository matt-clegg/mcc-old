var igalleryClass ={

	Implements: Options,

    options: {},

	initialize: function(options)
	{
        this.setOptions(options);
		this.imageIndex = this.options.activeImage;
		this.firstShow = true;
		this.currentHash = '';
		this.zIndex = 0;
		this.lastImageDisplayedIndex = -1;
		this.lightboxShowCounter = 0;
        this.imageShowCounter = 0;
		this.lboxPreloadStarted = false;
        this.indexsToPreload = new Array();
        this.indexsLoaded = new Array();
        this.plusOneDelays = new Array();
        this.fbLikeDelays = new Array();
        this.fbCommentDelays = new Array();
        this.twitterDelays = new Array();
        this.pInterestDelays = new Array();
        this.lastWindowWidth = 0;
        this.lastWindowHeight = 0;
        this.lboxFullHeight = 0;
        this.thumbsBelowHeight = 0;
        if(this.chk(document.id(this.options.reportContainer))){this.reportContainerHeight = document.id(this.options.reportContainer).getStyle('height');}

        this.isTouchDevice = ('ontouchstart' in window || 'onmsgesturechange' in window);
        this.userAgent = navigator.userAgent.toLowerCase();
        this.iOS = (navigator.userAgent.match(/(iPad|iPhone|iPod)/g) ? true : false);
        this.isAndroid = (this.userAgent.indexOf("android") > -1);
        this.safariExtra = (Browser.safari && this.userAgent.indexOf('chrome') == -1) ? 0.5 : 0;

        this.isIE8 = false;
        if(Browser.ie && Browser.version == 8){this.isIE8 = true};

        this.hoverLeftThumbArrow = false;
        this.hoverRightThumbArrow = false;
        this.hoverUpThumbArrow = false;
        this.hoverDownThumbArrow = false;

        if( this.chk( document.id(this.options.largeImage) ) )
        {
            document.id(this.options.largeImage).setStyle('height', this.options.largestHeight);
            document.id(this.options.largeImage).getElement('img.large_img').dispose();
            document.id(this.options.largeImage).setStyle('visibility','visible');
        }
		
		if(this.options.main == 1)
		{
			this.initializeMain();
		}
		
		if(this.options.showThumbs == 1 && this.options.main == 1)
		{
			this.initializeThumbs(this.imageIndex, 0);
		}
		
		if( (this.options.showSlideshowControls == 1 || this.options.slideshowAutostart == 1)  && this.options.main == 1 && this.options.showLargeImage == 1)
		{
			this.initializeSlideShow();
		}

        if(this.options.showLargeImage == 0 && this.options.lightboxOn == 1 && this.options.calledFrom != 'module')
        {
            if( window.location.hash.indexOf('!') != -1)
            {
                var hashVar = window.location.hash;
                var fileNameClean = hashVar.substr(2);
                if( fileNameClean.indexOf('#') != -1)
                {
                    fileNameClean = fileNameClean.substr(0, fileNameClean.indexOf('#'));
                }
                if(fileNameClean.indexOf('#') != -1)
                {
                    fileNameClean = fileNameClean.substring(0, fileNameClean.indexOf('#'))
                }

                this.options.jsonImages.general.each(function(el,index)
                {
                    var fileNameShort = el.filename.substring(0, el.filename.indexOf('-'))

                    if( fileNameShort == fileNameClean )
                    {
                        this.showLightBox.delay(750, this, index);
                    }
                }.bind(this));
            }
        }
    },

	initializeMain: function()
	{
        if(this.options.showLargeImage == 1 && this.options.refreshMode == 'hash')
        {
            if(window.location.hash.length == 0)
            {
                this.addHash(this.options.jsonImagesImageType[0]);
            }
        }

        var urlImage = this.getUrlParamater('image');

		if(urlImage != 'unset' && this.options.calledFrom != 'module')
		{
			if(urlImage != parseInt(urlImage))
			{
				for(var i=0; i<this.options.jsonImagesImageType.length; i++)
				{
					var fullPath = this.options.jsonImagesImageType[i].filename;
					var origImageName = fullPath.substring(fullPath.indexOf('/') + 1, fullPath.indexOf('/') + 1 + urlImage.length);
					if(origImageName == urlImage)
					{
						this.imageIndex = i;
						break;
					}
				}
			}
			else
			{
				this.imageIndex = urlImage - 1;
			}
		}

        this.checkHash(false);

		if(this.options.refreshMode == 'hash' && this.options.showLargeImage == 1)
		{
            this.setCheckHashPeriodical();
		}
		
		if(this.options.preload == 1 && this.options.showLargeImage == 1)
		{
            for(var i=0; i<12; i++ )
            {
                this.addToPreload(i);
            }
            this.preloaderVar = this.preloadImages.periodical(750, this);
        }

        if(this.options.showLargeImage == 1)
		{
			this.swapImage(this.options.jsonImagesImageType[this.imageIndex], 50, this.imageIndex, false);
		}
		
		this.boundAddKeyEvent = this.addKeyEvent.bind(this);
		if(this.options.showLargeImage == 1)
		{
			document.addEvent('keydown', this.boundAddKeyEvent);
		}

        this.setThumbContainerHeightPeriodical = this.setThumbContainerHeight.periodical(500, this);

        if(this.options.desPostion == 'left' || this.options.desPostion == 'right' && this.options.showLargeImage == 1)
        {
            this.setDesContainerHeightPeriodical = this.setDesContainerHeight.periodical(500, this);
        }

        if(this.options.showLargeImage == 1)
		{
			this.setMainImageDivHeightPeriodical = this.setMainImageDivHeight.periodical(500, this);
		}

		if(this.options.allowRating == 2)
        {
		    this.initializeRating();
        }
    },

	initializeRating: function()
    {
        if( this.chk( document.id(this.options.ratingsContainer) ) )
        {
            var stars = document.id(this.options.ratingsContainer).getElements('a.rating_star');

            stars.each(function(el,index)
            {
                el.addEvent('click', function(event)
                {
                    event.stop();
                    document.id(this.options.ratingsContainer).getElement('span.rating_loading_gif').setStyle('visibility', 'visible');

                    var ratingUrl = this.options.hostRelative + '/index.php?option=com_igallery&task=imagefront.addRating&format=raw&rating=' + (index + 1) + '&imageid=' + this.options.idArray[this.imageIndex];

                    var ratingAjax = new Request({url: ratingUrl, method: 'get',

                    onFailure: function(response)
                    {
                        document.id(this.options.ratingsContainer).getElement('span.rating_message').set('html','Error: ' + response.statusText);
                    },

                    onSuccess: function(response)
                    {
                        document.id(this.options.ratingsContainer).getElement('span.rating_loading_gif').setStyle('visibility', 'hidden');

                        response = response.trim();
                        if( response.indexOf('{') > 0 )
                        {
                            response  = response.substr(response.indexOf('{') );
                        }

                        responseObject = JSON.decode(response);

                        document.id(this.options.ratingsContainer).getElement('span.rating_message').set('html',responseObject.message);
                        if(responseObject.success == 1)
                        {
                            this.options.jsonImages.general[this.imageIndex].ratingAverage = responseObject.average;
                            this.options.jsonImages.general[this.imageIndex].ratingCount++;

                            this.swapRatings(this.imageIndex, false);
                        }
                    }.bind(this)});

                    ratingAjax.send();
                }.bind(this));
            }.bind(this));
        }
    },

    setThumbContainerHeight: function()
    {
        if(this.options.thumbPostion == 'above' || this.options.thumbPostion == 'below')
        {
            if( this.chk( document.id(this.options.thumbContainer) ) )
            {
                if(document.id(this.options.thumbContainer).getStyle('max-height') == 'none')
                {
                    document.id(this.options.thumbContainer).setStyle('height', 'auto');
                    var currentHeight = document.id(this.options.thumbContainer).getSize().y;
                    if(currentHeight != this.thumbsBelowHeight)
                    {
                        var newHeight = currentHeight + 4;
                        document.id(this.options.thumbContainer).setStyle('height', newHeight);
                        this.thumbsBelowHeight = newHeight;
                    }
                }
            }
        }
        else
        {
            if(this.options.showLargeImage == 1)
            {
                var largeImgDivSize = document.id(this.options.largeImage).getSize();

                if(largeImgDivSize.y > 50)
                {
                    if( this.chk( document.id(this.options.thumbContainer) ) )
                    {
                        document.id(this.options.thumbContainer).setStyle('max-height', largeImgDivSize.y);
                    }
                }
            }
        }
    },

    setMainImageDivHeight: function()
    {
        var largestHeight = 0
		var imageHolders = document.id(this.options.largeImage).getElements('div.large_img_holder');

		imageHolders.each(function(el,index)
		{
			if(el.getStyle('display') != 'none')
			{
				var elementHeight = el.getSize().y;
				largestHeight = elementHeight > largestHeight ? elementHeight : largestHeight;
			}
		});

		if(largestHeight > 50)
        {
            if( this.chk( document.id(this.options.largeImage) ) )
            {
                document.id(this.options.largeImage).setStyle('height', largestHeight);
            }
        }
    },

	setLboxImageDivHeight: function()
    {
        var largestHeight = 0
		var imageHolders = document.id(this.lboxGalleryObject.options.largeImage).getElements('div.large_img_holder');

		imageHolders.each(function(el,index)
		{
			if(el.getStyle('display') != 'none')
			{
				var elementHeight = el.getSize().y;
				largestHeight = elementHeight > largestHeight ? elementHeight : largestHeight;
			}
		});

		if(largestHeight > 50)
        {
            if( this.chk( document.id(this.lboxGalleryObject.options.largeImage) ) )
            {
                document.id(this.lboxGalleryObject.options.largeImage).setStyle('height', largestHeight);
            }
        }
    },

    setDesContainerHeight: function()
    {
        var largeImgDivSize = document.id(this.options.largeImage).getSize();

        if(largeImgDivSize.y > 50)
        {
            if( this.chk( document.id(this.options.desContainer) ) )
            {
                document.id(this.options.desContainer).setStyle('height', largeImgDivSize.y);
            }
        }
    },

    lboxSetThumbContainerHeight: function()
    {
        var largeImgDivSize = document.id(this.lboxGalleryObject.options.largeImage).getSize();

        if(largeImgDivSize.y > 50)
        {
            if( this.chk( document.id(this.lboxGalleryObject.options.thumbContainer) ) )
            {
                document.id(this.lboxGalleryObject.options.thumbContainer).setStyle('max-height', largeImgDivSize.y);
            }
        }
    },

    lboxSetDesContainerHeight: function()
    {
        var largeImgDivSize = document.id(this.lboxGalleryObject.options.largeImage).getSize();

        if(largeImgDivSize.y > 50)
        {
            if( this.chk( document.id(this.lboxGalleryObject.options.desContainer) ) )
            {
                document.id(this.lboxGalleryObject.options.desContainer).setStyle('height', largeImgDivSize.y);
            }
        }
    },
	
	addKeyEvent: function(event)
	{
		if(event.key == 'right')
		{
			this.clearSlideShow();
			this.slideShowSwap(true);
		}
		if(event.key == 'left')
		{
			this.clearSlideShow();
			this.slideShowSwap(false);
		}
	},
	
	initializeThumbs: function(index, lightboxShowCounter)
	{
        var activeThumbId = this.options.prefix + '-' + this.options.uniqueid + '-' + (index + 1);
        if( this.chk( document.id(activeThumbId) ) )
        {
            var ScrolltoThumb = new Fx.Scroll(this.options.thumbContainer,{duration: 50});
            ScrolltoThumb.toElement( document.id(activeThumbId) );
        }

        if(lightboxShowCounter == 0)
        {
            if(this.options.showThumbArrows == 1)
            {
                var hasXOverflow = (document.id(this.options.thumbTable).getSize().x > (document.id(this.options.thumbContainer).getSize().x + 20));
                var hasYOverflow = (document.id(this.options.thumbTable).getSize().y > (document.id(this.options.thumbContainer).getSize().y + 20));
                var xScrollAmount = document.id(this.options.thumbContainer).getSize().x - 120;
                var yScrollAmount = document.id(this.options.thumbContainer).getSize().y - 120;

                if(hasXOverflow)
                {
                    this.addArrowBehaviors(this.options.rightArrow, xScrollAmount, 'horizontal', 'right');
                    this.addArrowBehaviors(this.options.leftArrow, -xScrollAmount, 'horizontal', 'left');
                }
                else if(hasYOverflow)
                {
                    this.addArrowBehaviors(this.options.upArrow, -yScrollAmount, 'vertical', 'up');
                    this.addArrowBehaviors(this.options.downArrow, yScrollAmount, 'vertical', 'down');
                }
            }

            var thumblinksArray = document.id(this.options.thumbTable).getElements('a.imglink');

            thumblinksArray.each(function(el,index)
            {
                el.addEvent('click', function(event)
                {
                    event.stop();
                    this.clearSlideShow();

                    if(this.options.showLargeImage == 0 && this.options.main == 1)
                    {
                        var imgLink = this.options.jsonImages.general[index].url;
                        var imgTargetBlank = this.options.jsonImages.general[index].targetBlank;

                        if(imgLink.length > 1)
                        {
                            el.setStyle('cursor', 'pointer');

                            if(imgTargetBlank == 1)
                            {
                                window.open(imgLink);
                            }
                            else
                            {
                                window.location = imgLink;
                            }
                        }
                        else
                        {
                            if(this.options.lightboxOn == 1)
                            {
                                this.showLightBox(index);
                            }
                        }
                    }
                    else
                    {
                        this.swapImage(this.options.jsonImagesImageType[index], this.options.fadeDuration, index, true);
                    }

                }.bind(this));

            }.bind(this));
        }
	},
	
	initializeSlideShow: function()
	{
		this.clearSlideShow();
		
        if(this.options.showSlideshowControls == 1)
		{
			document.id(this.options.slideshowForward).removeEvents();
			document.id(this.options.slideshowForward).addEvent('click', function(e)
			{
				e.stopPropagation();
				this.clearSlideShow();
				this.slideShowSwap(true);
			}.bind(this));

			document.id(this.options.slideshowRewind).removeEvents();
			document.id(this.options.slideshowRewind).addEvent('click', function(e)
			{
				e.stopPropagation();
				this.clearSlideShow();
				this.slideShowSwap(false);
			}.bind(this));
		}
		
		if(this.options.slideshowAutostart == 1 && this.options.showLargeImage == 1)
		{
			this.slideShowStart(false);
		}

        if(this.options.slideshowPosition == 'left-right' && this.options.showSlideshowControls == 1 && this.isIE8 == false)
        {
            this.leftRightSlideBaseOpacity = this.isTouchDevice ? 0.5 : 0.4;
            document.id(this.options.slideshowForward).setStyle('opacity', this.leftRightSlideBaseOpacity);
            document.id(this.options.slideshowRewind).setStyle('opacity', this.leftRightSlideBaseOpacity);

            if(!this.isTouchDevice)
            {
                document.id(this.options.largeImage).removeEvents('mouseenter');
                document.id(this.options.largeImage).addEvent('mouseenter', function()
                {
                    var fadein = new Fx.Tween(document.id(this.options.slideshowForward), {property:'opacity', duration:250} ).start(this.leftRightSlideBaseOpacity,0.9);
                    var fadein1 = new Fx.Tween(document.id(this.options.slideshowRewind), {property:'opacity', duration:250} ).start(this.leftRightSlideBaseOpacity,0.9);

                }.bind(this));

                document.id(this.options.largeImage).removeEvents('mouseleave');
                document.id(this.options.largeImage).addEvent('mouseleave', function()
                {
                    var fadeout = new Fx.Tween(document.id(this.options.slideshowForward), {property:'opacity', duration:250} ).start(0.9,this.leftRightSlideBaseOpacity);
                    var fadeout1 = new Fx.Tween(document.id(this.options.slideshowRewind), {property:'opacity', duration:250} ).start(0.9,this.leftRightSlideBaseOpacity);

                }.bind(this));
            }
        }

	},
	
	checkHash: function(refreshImage)
	{
        var hashVar = window.location.hash;

        if(hashVar != this.currentHash && hashVar.length > 0)
        {
            var fileNameClean = hashVar.substr(2);

            if( fileNameClean.indexOf('#') >= 0 )
            {
                fileNameClean  = fileNameClean.substr(0, fileNameClean.indexOf('#') );
            }

            this.options.jsonImages.general.each(function(el,index)
            {
                var fileNameShort = el.filename.substring(0, el.filename.indexOf('-'))

                if( fileNameShort == fileNameClean )
                {
                    this.imageIndex = index;
                }
            }.bind(this));

            if(refreshImage == true)
            {
                this.swapImage(this.options.jsonImagesImageType[this.imageIndex], this.options.fadeDuration, this.imageIndex, true);
            }

            this.currentHash = hashVar;
        }

	},

    setCheckHashPeriodical : function()
    {
        this.checkHashPeriodical = this.checkHash.periodical(400, this, true);
    },

    clearCheckHashPeriodical : function()
    {
        clearInterval(this.checkHashPeriodical);
    },
    
	addHash : function(imageObject)
	{
		var slashPos = imageObject.filename.indexOf('/');
		var fileNameOnly  = imageObject.filename.substr(slashPos + 1);
		
		var dashPos = fileNameOnly.indexOf('-');
		var fileNameClean  = fileNameOnly.substr(0, dashPos);
		var hashToAdd = '!' + fileNameClean;
		
		window.location.hash = hashToAdd;
		this.currentHash = '#' + hashToAdd;
	},
	
	getUrlParamater : function (paramTarget)
	{
		var urlValue = 'unset';
		var url = window.location.href;
		
		if(url.indexOf("?") > -1)
		{
			var queryParams = url.substr(url.indexOf("?"));
			var queryParamsArray = queryParams.split("&");
			
			for(var i=0; i< queryParamsArray.length; i++ )
			{
				if( queryParamsArray[i].indexOf(paramTarget + "=") > -1 )
				{
					var paramMatch = queryParamsArray[i].split("=");
					urlValue = paramMatch[1];
					break;
				}
			}
		}
		return unescape(urlValue);
	},
	
	preloadImages : function()
	{
		if(this.indexsToPreload.length > 0)
        {
            var indexToLoad = this.indexsToPreload.shift();
            this.indexsLoaded.push(indexToLoad);
            new Asset.images([this.options.resizePath + this.options.jsonImagesImageType[indexToLoad].filename ],
            {
                onComplete: function(){}
            });
        }

	},

    addToPreload : function(index)
    {
        if(index < this.options.jsonImagesImageType.length)
        {
            if( this.indexsToPreload.indexOf(index) == -1 )
            {
                if( this.indexsLoaded.indexOf(index) == -1 )
                {
                    if( index >= 0 )
                    {
                        this.indexsToPreload.push(index);
                    }
                }
            }
        }
    },

    lboxPreloadStarter : function()
	{
        for(var i=0; i<12; i++ )
        {
            this.addToPreload(i);
        }
		this.preloaderVar = this.preloadImages.periodical(750, this);
	},
	
	addArrowBehaviors: function(arrow, pixels, mode, direction)
	{
		var child = document.id(arrow).getElement('div');
		document.id(arrow).setStyle('display', 'block');

		if(this.isIE8)
		{
            document.id(arrow).setStyle('max-width', 'none');
		}

		if(!this.isIE8)
        {
            document.id(arrow).setStyle('opacity', 0.8);

            document.id(arrow).addEvent('mouseenter', function()
            {
                var fadein = new Fx.Tween(document.id(arrow), {property:'opacity', duration:250} ).start(0.8,0.95);
            }.bind(this));

            document.id(arrow).addEvent('mouseleave', function()
            {
                var fadeout = new Fx.Tween(document.id(arrow), {property:'opacity', duration:250} ).start(0.95,0.8);
            }.bind(this));
        }

        this.thumbClickScroller = new Fx.Scroll(this.options.thumbContainer,{duration: 1000, transition: 'linear'});
        this.thumbHoverScroller = new Fx.Scroll(this.options.thumbContainer,{duration: 6000, transition: 'linear'});
		
		document.id(arrow).addEvent('click', function(e)
		{
			var containerSizeArray = document.id(this.options.thumbContainer).getScroll();
			var currentScrollX = containerSizeArray.x;
			var currentScrollY = containerSizeArray.y;

			if(direction == 'right')
			{
				this.thumbHoverScroller.cancel();
				this.thumbClickScroller.cancel();
				this.thumbClickScroller.start(currentScrollX + pixels, currentScrollY).chain(function()
                {
                    if(this.hoverRightThumbArrow)
                    {
                        var duration = (document.id(this.options.thumbContainer).getScrollSize().x - (document.id(this.options.thumbContainer).getScroll().x + document.id(this.options.thumbContainer).getSize().x)) * 4;
                        this.thumbHoverScroller = new Fx.Scroll(this.options.thumbContainer,{duration: duration, transition: 'linear'});
                        this.thumbHoverScroller.toRight();
                    }
                }.bind(this));

			}

			if(direction == 'left')
			{
				this.thumbHoverScroller.cancel();
				this.thumbClickScroller.cancel();
				this.thumbClickScroller.start(currentScrollX + pixels, currentScrollY).chain(function()
                {
                    if(this.hoverLeftThumbArrow)
                    {
                        var duration = document.id(this.options.thumbContainer).getScroll().x * 4;
                        this.thumbHoverScroller = new Fx.Scroll(this.options.thumbContainer,{duration: duration, transition: 'linear'});
                        this.thumbHoverScroller.toLeft();
                    }
                }.bind(this));

			}

			if(direction == 'up')
			{
				this.thumbHoverScroller.cancel();
				this.thumbClickScroller.cancel();
				this.thumbClickScroller.start(currentScrollX, currentScrollY + pixels).chain(function()
                {
                    if(this.hoverUpThumbArrow)
                    {
                        var duration = document.id(this.options.thumbContainer).getScroll().y * 4;
                        this.thumbHoverScroller = new Fx.Scroll(this.options.thumbContainer,{duration: duration, transition: 'linear'});
                        this.thumbHoverScroller.toTop();
                    }
                }.bind(this));
            }

            if(direction == 'down')
			{
				this.thumbHoverScroller.cancel();
				this.thumbClickScroller.cancel();
				this.thumbClickScroller.start(currentScrollX, currentScrollY + pixels).chain(function()
                {
                    if(this.hoverDownThumbArrow)
                    {
                        var duration = (document.id(this.options.thumbContainer).getScrollSize().y - (document.id(this.options.thumbContainer).getScroll().y + document.id(this.options.thumbContainer).getSize().y)) * 4;
                        this.thumbHoverScroller = new Fx.Scroll(this.options.thumbContainer,{duration: duration, transition: 'linear'});
                        this.thumbHoverScroller.toBottom();
                    }
                }.bind(this));
            }

		}.bind(this));

		if(!this.iOS && !this.isAndroid)
        {
            document.id(arrow).addEvent('mouseenter', function()
            {
                if(direction == 'right')
                {
                    this.hoverRightThumbArrow = true;
                    var duration = (document.id(this.options.thumbContainer).getScrollSize().x - (document.id(this.options.thumbContainer).getScroll().x + document.id(this.options.thumbContainer).getSize().x)) * 4;
                    this.thumbHoverScroller = new Fx.Scroll(this.options.thumbContainer,{duration: duration, transition: 'linear'});
                    this.thumbHoverScroller.toRight();
                }
                if(direction == 'left')
                {
                    this.hoverLeftThumbArrow = true;
                    var duration = document.id(this.options.thumbContainer).getScroll().x * 4;
                    this.thumbHoverScroller = new Fx.Scroll(this.options.thumbContainer,{duration: duration, transition: 'linear'});
                    this.thumbHoverScroller.toLeft();
                }

                if(direction == 'down')
                {
                    this.hoverDownThumbArrow = true;
                    var duration = (document.id(this.options.thumbContainer).getScrollSize().y - (document.id(this.options.thumbContainer).getScroll().y + document.id(this.options.thumbContainer).getSize().x)) * 4;
                    this.thumbHoverScroller = new Fx.Scroll(this.options.thumbContainer,{duration: duration, transition: 'linear'});
                    this.thumbHoverScroller.toBottom();
                }
                if(direction == 'up')
                {
                    this.hoverUpThumbArrow = true;
                    var duration = document.id(this.options.thumbContainer).getScroll().y * 4;
                    this.thumbHoverScroller = new Fx.Scroll(this.options.thumbContainer,{duration: duration, transition: 'linear'});
                    this.thumbHoverScroller.toTop();
                }
            }.bind(this));

            document.id(arrow).addEvent('mouseleave', function()
            {
                this.thumbHoverScroller.cancel();
                this.hoverLeftThumbArrow = false;
                this.hoverRightThumbArrow = false;
                this.hoverUpThumbArrow = false;
                this.hoverDownThumbArrow = false;

            }.bind(this));
        }
	},
	
	slideShowStart : function(instant)
	{
		if(instant == true)
		{
			this.slideShowSwap(true);
		}

		this.slideShowObject = this.slideShowSwap.periodical(this.options.slideshowPause, this, true);
		
		if(this.options.showSlideshowControls == 1 && this.chk( document.id(this.options.slideshowPlay) )  )
		{
			document.id(this.options.slideshowPlay).removeClass('ig_slideshow_play');
			document.id(this.options.slideshowPlay).addClass('ig_slideshow_pause');
			document.id(this.options.slideshowPlay).removeEvents();
			document.id(this.options.slideshowPlay).addEvent('click', function(e)
			{
				this.clearSlideShow();
			}.bind(this));
		}
	},
	
	slideShowSwap : function(forward)
	{
		if(forward == true)
		{
			if(this.imageIndex == this.options.numPics - 1)
			{
				this.imageIndex = 0;
			}
			else
			{
				this.imageIndex++;
			}
		}
		else
		{
			if(this.imageIndex == 0)
			{
				this.imageIndex = this.options.numPics - 1;
			}
			else
			{
				this.imageIndex--;
			}
		}
		
		this.swapImage(this.options.jsonImagesImageType[this.imageIndex], this.options.fadeDuration, this.imageIndex, true);
	},

	clearSlideShow : function()
	{
        clearInterval(this.slideShowObject);
	
		if(this.options.showSlideshowControls == 1 && this.chk( document.id(this.options.slideshowPlay) ) )
		{
			document.id(this.options.slideshowPlay).removeClass('ig_slideshow_pause');
			document.id(this.options.slideshowPlay).addClass('ig_slideshow_play');
			document.id(this.options.slideshowPlay).removeEvents();
			document.id(this.options.slideshowPlay).addEvent('click', function(e)
			{
				this.slideShowStart(true);
			}.bind(this));
		}
	},
	
	swapImage : function(imageObject, fadeDuration, index, addHash)
	{
		this.imageIndex = index;
		
		this.insertImage(imageObject, fadeDuration, this.imageIndex);

        this.addToPreload(index + 1);
        this.addToPreload(index + 2);
        this.addToPreload(index - 1);
        this.addToPreload(index + 3);
		
		if(this.options.main == 1 && this.options.showLargeImage == 1)
		{
			this.addMainImageClick(this.imageIndex);
		}
		
		if(this.options.showThumbs == 1)
		{
			this.swapThumbs(index);
		}
		
		if(this.options.showDescriptions == 1)
		{
			this.swapDescription(index);
		}
		
		if(this.options.showTags == 1)
		{
			this.swapTags(index);
		}
		
		if(this.options.downloadType != 'none')
		{
			this.swapDownload(index);
		}
		
		if(this.options.facebookShare == 1)
		{
			this.swapFacebook(index, imageObject);
		}
		
		if(this.options.showPlusOne == 1)
		{
			this.swapPlusOne(index, imageObject);
		}

        if(this.options.twitterButton == 1)
        {
            this.swapTwitterButton(index, imageObject);
        }

        if(this.options.pinterestButton == 1)
        {
            this.swapPinterestButton(index, imageObject);
        }

        if(this.options.allowComments == 2)
		{
			this.swapJcomments(index, imageObject);
		}
		
		if(this.options.allowComments == 4)
		{
			this.swapFbComments(index, imageObject);
		}
		
		if(this.options.reportImage == 1)
		{
			this.swapReportImage(index);
		}
		
		if(this.options.numberingOn == 1)
		{
			this.swapNumbering(index);
		}

        if(this.options.showImageAuthor == 1)
        {
            this.swapImageAuthor(index);
        }

        if(this.options.showImageHits == 1)
        {
            this.swapImageHits(index);
        }

        if(this.options.allowRating == 2)
		{
			this.swapRatings(index, true);
		}

        if(this.options.refreshMode == 'hash' && addHash == true)
        {
            this.addHash(imageObject);
        }
		
		if(this.options.collectImageViews == 1)
		{
			this.addImageHit();
		}

        this.imageShowCounter++;
        this.firstShow = false;
	},
	
	insertImage : function(imageObject, fadeDuration, index)
	{
		if(this.lastImageDisplayedIndex == index)
		{
			return;
		}
		
		if(this.lastImageDisplayedIndex >= 0)
		{
			var imageToRemove = this.lastImageDisplayed;
			var imageToRemoveWidth = parseInt(imageToRemove.getStyle('width'));
			var imageToRemoveHeight = parseInt(imageToRemove.getStyle('height'));
		}
		else
		{
			var imageToRemove = null;
			var imageToRemoveWidth = 0;
			var imageToRemoveHeight = 0;
		}
		
		var insertedImageHolders = document.id(this.options.largeImage).getElements('div.large_img_holder');
		var insertedMatch = false;

		for(var i=0; i<insertedImageHolders.length; i++)
		{
			var insertedImageHolderId = insertedImageHolders[i].getProperty('id');
			var idSplitted = insertedImageHolderId.split('-');
			var insertedImageHolderCounter = idSplitted[2];

			if(insertedImageHolderCounter == index)
			{
				insertedMatch = true;
				holderToInsert = document.id(insertedImageHolderId);
				break;
			}
		}

		if(insertedMatch == true)
		{
            var imageToInsert = document.id(insertedImageHolderId).getElement('img');

			var imageToInsertWidth = imageToInsert.getStyle('width').toInt();
			var imageToInsertHeight = imageToInsert.getStyle('height').toInt();

			var widthDiff = imageToInsertWidth - imageToRemoveWidth;
			var heightDiff = imageToInsertHeight - imageToRemoveHeight;

			if( widthDiff < 5 && widthDiff > -5 && heightDiff < 5 && heightDiff > -5)
			{
				var wait = true;
			}
			else
			{
				var wait = false;
				this.removeImage(fadeDuration, insertedImageHolderId);
			}

			document.id(insertedImageHolderId).setStyle('z-index', this.zIndex);
			document.id(insertedImageHolderId).setStyle('display', 'block');
			this.zIndex++;

            var imageFadeIn = new Fx.Tween(insertedImageHolderId, {property:'opacity', duration:fadeDuration}).start(0,1).chain(function()
			{
				if(wait == true)
				{
					this.removeImage(50, insertedImageHolderId);
				}
			}.bind(this));

            this.lastImageDisplayed = imageToInsert;
            this.lastImageDisplayedIndex = index;

			if(this.options.main == true && this.options.magnify == 1 && this.options.lightboxOn == 1)
			{
				this.insertMagnify(index, imageObject);
			}
		}

		else
		{
			if( (Math.abs(parseInt(imageObject.width - imageToRemoveWidth)) < 5) && (Math.abs(parseInt(imageObject.height - imageToRemoveHeight)) < 5) )
			{
				var wait = true;
			}
			else
			{
				var wait = false;
				this.removeImage(fadeDuration, 'ig' + this.options.main + '-' + this.options.uniqueid + '-' + index);
			}

			var ImageAsset = new Asset.images([this.options.resizePath + imageObject.filename ],
			{
				onComplete: function()
				{
                    ImageAsset.removeProperty('width');
                    ImageAsset.removeProperty('height');

                    var insertDimensions = this.getInsertImageDimensions(imageObject);

					ImageAsset.setStyles
					({
                        'max-width': (insertDimensions.imageToInjectWidthPercent + 0.1) + '%',
                        'margin-left': insertDimensions.MarginLeft + '%',
                        'margin-right': insertDimensions.MarginRight + '%',
                        'margin-top': insertDimensions.MarginTop + '%',
                        'margin-bottom': insertDimensions.MarginBottom + '%',
                        padding: insertDimensions.imageToInjectPaddingPercent + '%'
                        /*'max-width': '100%'imageObject.width*/
					});

					ImageAsset.setProperty('class', 'large_img');
					ImageAsset.setProperty('alt', this.options.jsonImages.general[index].alt);

                    var imageHolderId = 'ig' + this.options.main + '-' + this.options.uniqueid + '-' + index;
                    var largeImgHolder = new Element('div', {'id': imageHolderId, 'class': 'large_img_holder', styles: {position: 'absolute', width: '100%', 'z-index': this.zIndex, opacity: 0} });
					largeImgHolder.inject( document.id(this.options.largeImage), 'top' );
					this.zIndex++;
                    ImageAsset.inject( document.id(imageHolderId) );
                    this.setMainImageDivHeight();
					document.id(this.options.largeImage).setStyle('visibility','visible');

					var ImageHolderInjected = document.id(imageHolderId);
					var imageFadeIn = new Fx.Tween(ImageHolderInjected, {property:'opacity',duration:fadeDuration}).start(0,1).chain(function()
					{
						if(wait == true)
						{
							this.removeImage(50, imageHolderId);
						}
					}.bind(this));

                    this.lastImageDisplayed = document.id(imageHolderId).getElement('img');
                    this.lastImageDisplayedIndex = index;

					if(this.options.main == true && this.options.magnify == 1 && this.options.lightboxOn == 1)
					{
						this.insertMagnify(index, imageObject);
					}

                }.bind(this)
			});
		}
	},

    getInsertImageDimensions: function(imageObject)
    {
        var imageToInjectMarginBasePercent = (Math.round( (this.options.largeImageMargin/this.options.largeImageDivWidth) * 10000) /10000) * 100;
        var imageToInjectPaddingPercent = (Math.round( (this.options.largeImagePadding/this.options.largeImageDivWidth) * 10000) /10000) * 100;
        var insidePaddingPercent = 100 - ( (imageToInjectMarginBasePercent * 2) + (imageToInjectPaddingPercent * 2) );

        var imageToInjectWidthPercent = (Math.round( (imageObject.width/this.options.largeImageDivWidth) * 10000) /10000) * 100;
        var horizontalSpacingMarginPercent = (insidePaddingPercent - imageToInjectWidthPercent) / 2;

        var verticalMarginSpacingPixel = ( (this.options.largestHeight - imageObject.height) / 2);
        var verticalMarginSpacingPercent = (Math.round( (verticalMarginSpacingPixel/this.options.largeImageDivWidth) * 10000) /10000) * 100;

        if(this.options.imageAlignHoriz == 'left')
        {
            var MarginLeft = imageToInjectMarginBasePercent;
            var MarginRight = imageToInjectMarginBasePercent + (horizontalSpacingMarginPercent * 2);

        }
        else if(this.options.imageAlignHoriz == 'center')
        {
            var MarginLeft = imageToInjectMarginBasePercent + horizontalSpacingMarginPercent;
            var MarginRight = imageToInjectMarginBasePercent + horizontalSpacingMarginPercent;
        }
        else if(this.options.imageAlignHoriz == 'right')
        {
            var MarginLeft = imageToInjectMarginBasePercent + (horizontalSpacingMarginPercent * 2);
            var MarginRight = imageToInjectMarginBasePercent;
        }

        if(this.options.imageAlignVert == 'top')
        {
            var MarginTop = imageToInjectMarginBasePercent;
            var MarginBottom = imageToInjectMarginBasePercent + (verticalMarginSpacingPercent * 2);

        }
        else if(this.options.imageAlignVert == 'center')
        {
            var MarginTop = imageToInjectMarginBasePercent + verticalMarginSpacingPercent;
            var MarginBottom = imageToInjectMarginBasePercent + verticalMarginSpacingPercent;

        }
        else if(this.options.imageAlignVert == 'bottom')
        {
            var MarginTop = imageToInjectMarginBasePercent + (verticalMarginSpacingPercent * 2);
            var MarginBottom = imageToInjectMarginBasePercent;
        }

        insertDimensions = new Object();
        insertDimensions.imageToInjectWidthPercent = imageToInjectWidthPercent + this.safariExtra;
        insertDimensions.imageToInjectPaddingPercent = imageToInjectPaddingPercent;
        insertDimensions.MarginLeft = MarginLeft;
        insertDimensions.MarginRight = MarginRight;
        insertDimensions.MarginTop = MarginTop;
        insertDimensions.MarginBottom = MarginBottom;

        return insertDimensions;
    },
  
	removeImage : function(fadeDuration, currentImgHolderId)
	{
        currentImgHolderId = 'ig' + this.options.main + '-' + this.options.uniqueid + '-' + this.imageIndex;

        var insertedImageHolders = document.id(this.options.largeImage).getElements('div.large_img_holder');

        for(var i=0; i<insertedImageHolders.length; i++)
        {
            var opacity = insertedImageHolders[i].getStyle('opacity');

            if(opacity != 0)
            {
                if(insertedImageHolders[i].getProperty('id') != currentImgHolderId)
                {
                    var currentElement = insertedImageHolders[i];

                    this.imageFadeAway = new Fx.Tween(insertedImageHolders[i], {property:'opacity',duration:fadeDuration}).start(0).chain(function()
                    {
                        var elementIndex = currentElement.id.split('-').pop();

                        if(elementIndex != this.imageIndex)
                        {
                            currentElement.setStyle('display', 'none');
                        }
                    }.bind(this));
                }
            }
        }

		if(this.options.main == 1 && this.options.lightboxOn == 1)
		{
			if (this.options.magnify == 1 && this.chk( document.id('magnifygif' + this.options.uniqueid) ) )
			{
				document.id('magnifygif' + this.options.uniqueid).dispose();
			}
		}
	},
	
	insertMagnify : function(index, imageObject)
	{
		var magnifyImage = new Asset.images([this.options.imageAssetPath + 'magnify.gif' ],
		{
			onComplete: function()
			{
                var insertDimensions = this.getInsertImageDimensions(imageObject);

                var magnifyWidthPercent = (Math.round( (magnifyImage[0].width/this.options.largeImageDivWidth) * 10000) /10000) * 100;
                var magnifyHeightPercent = (Math.round( (magnifyImage[0].height/this.options.largeImageDivWidth) * 10000) /10000) * 100;
                var ImageHeightPercent = (Math.round( (imageObject.height/this.options.largeImageDivWidth) * 10000) /10000) * 100;

                var magnifyLeftPercent = insertDimensions.imageToInjectWidthPercent + insertDimensions.imageToInjectPaddingPercent + insertDimensions.MarginLeft - magnifyWidthPercent;
                var magnifyTopPercent = ImageHeightPercent + insertDimensions.imageToInjectPaddingPercent + insertDimensions.MarginTop - magnifyHeightPercent;

                magnifyImage[0].inject(this.options.largeImage).setStyles
				({
					position: 'absolute',
					left: 0,
					top: 0,
                    'margin-left': (magnifyLeftPercent - 0.5) + '%',
                    'margin-top': (magnifyTopPercent - 0.5) + '%',
					'z-index': 100,
					opacity: 0.7,
                    width: magnifyWidthPercent + '%',
                    height: 'auto'
				});
				
				magnifyImage[0].setProperty('id', 'magnifygif' + this.options.uniqueid);
			
			}.bind(this)
		});
	},
	
	addMainImageClick : function(index)
	{
		var imgLink = this.options.jsonImages.general[index].url;
		var imgTargetBlank = this.options.jsonImages.general[index].targetBlank;
		
		if(imgLink.length > 1)
		{
			document.id(this.options.largeImage).setStyle('cursor', 'pointer');
			document.id(this.options.largeImage).removeEvents('click');
			
			document.id(this.options.largeImage).addEvent('click', function(e)
			{
				if (imgTargetBlank == 1)
				{
					window.open(imgLink);
				}
				else
				{
					window.location = imgLink;
				}
			}.bind(this));
		}
		
		if(this.options.lightboxOn == 1 && imgLink.length < 2)
		{
			document.id(this.options.largeImage).removeEvents('click');
			
			document.id(this.options.largeImage).setStyle('cursor', 'pointer');
			
			document.id(this.options.largeImage).addEvent('click', function(e)
			{
				this.showLightBox(index);
			}.bind(this));
		}
		
		else if(this.options.lightboxOn == 0 && imgLink.length < 2 && this.options.slideshowPosition != 'left-right')
		{
			document.id(this.options.largeImage).removeEvents('click');
			
			document.id(this.options.largeImage).addEvent('click', function(e)
			{
				this.clearSlideShow();
				this.slideShowSwap(true);
			}.bind(this));
		}

        else if(this.options.lightboxOn == 0 && imgLink.length < 2 && this.options.slideshowPosition == 'left-right')
        {
            document.id(this.options.largeImage).removeEvents('click');
            document.id(this.options.largeImage).setStyle('cursor', 'auto');
        }

	},
	
	swapThumbs : function(index)
	{
		var thumbCells = document.id(this.options.thumbTable).getElements('td');
		thumbCells.each(function(el,index)
		{
			el.setProperty('class','inactive_thumb');
		}.bind(this));

		var currentThumb = thumbCells[index];
		currentThumb.setProperty('class','active_thumb');

		if(this.firstShow == false)
        {
            var hasXOverflow = (document.id(this.options.thumbTable).getSize().x > (document.id(this.options.thumbContainer).getSize().x + 50));
            var hasYOverflow = (document.id(this.options.thumbTable).getSize().y > (document.id(this.options.thumbContainer).getSize().y + 50));

            if(hasXOverflow)
            {
                var thumbPosition = currentThumb.getPosition( document.id(this.options.thumbContainer)).x;
                var containerWidth = document.id(this.options.thumbContainer).getSize().x;

                if(thumbPosition > containerWidth)
                {
                    var ScrolltoThumb = new Fx.Scroll(this.options.thumbContainer,{duration: 400});
                    ScrolltoThumb.toElement( currentThumb );
                }
                else if(thumbPosition < 0)
                {
                    var thumbOffset = currentThumb.getPosition( document.id(this.options.thumbTable)).x;
                    var positionToScroll = thumbOffset - (containerWidth - currentThumb.getSize().x);
                    var ScrolltoThumb = new Fx.Scroll(this.options.thumbContainer,{duration: 400});
                    ScrolltoThumb.start( positionToScroll );
                }
            }
            else if(hasYOverflow)
            {
                var thumbPosition = currentThumb.getPosition( document.id(this.options.thumbContainer)).y;
                var containerHeight = document.id(this.options.thumbContainer).getSize().y;

                if(thumbPosition > containerHeight)
                {
                    var ScrolltoThumb = new Fx.Scroll(this.options.thumbContainer,{duration: 400});
                    ScrolltoThumb.toElement( currentThumb );
                }
                else if(thumbPosition < 0)
                {
                    var thumbOffset = currentThumb.getPosition( document.id(this.options.thumbTable)).y;
                    var positionToScroll = thumbOffset - (containerHeight - currentThumb.getSize().y);
                    var ScrolltoThumb = new Fx.Scroll(this.options.thumbContainer,{duration: 400});
                    ScrolltoThumb.start(0,positionToScroll);
                }
            }
        }
	},
	
	swapDescription : function(index)
	{
		if( this.chk( document.id(this.options.desContainer) ) )
		{
			var descriptionDivs = document.id(this.options.desContainer).getElements('.des_div');
			descriptionDivs.each(function(el,index)
			{
				el.setStyle('display', 'none');
			});
			
			document.id(this.options.desContainer).scrollTo(0,0);
			descriptionDivs[index].setStyle('display', 'block');
		}
	},
  
	swapTags : function(index)
	{
		var tagsDivs = document.id(this.options.tagsContainer).getElements('div.tags_div');
		
		tagsDivs.each(function(el,index)
		{
			el.setStyle('display', 'none');
		});
		
		tagsDivs[index].setStyle('display', 'block');
		
		var taglinks = tagsDivs[index].getElements('a');
		
		if(taglinks.length == 0)
		{
			tagsDivs[index].setStyle('visibility', 'hidden');
		}
	},

    swapFacebook : function(index, imageObject)
    {
        if(this.options.facebookLegacy == 1)
        {
            var urlToShare = this.getLegacyUrl(index, imageObject);
        }
        else
        {
            var urlToShare = this.getHashUrl(index, imageObject);
        }

        var fbContainer = document.id(this.options.facebookContainer);
        var fbTempContainer = document.id(this.options.facebookTempContainer);

        if(this.options.fbButtonType == 'like')
        {
            var fbHtml = '<fb:like send="false" layout="button_count" show_faces="true" href="' + urlToShare + '" width="' + this.options.fbLikeWidth + '" colorscheme="' + this.options.facebookColor + '" ></fb:like>';
        }
        else
        {
            var fbHtml = '<div class="fb-share-button" data-href="' + urlToShare  + '" data-type="button_count" data-width="' + this.options.fbLikeWidth + '"></div>';
        }

        fbTempContainer.set('html',fbHtml);
        if(typeof(FB) != 'undefined')
        {
            FB.XFBML.parse(fbTempContainer);
        }

        var fbLikeToMove = fbTempContainer.getFirst();
        fbLikeToMove.setStyles
        ({
            position: 'absolute',
            top: 0,
            left: 0
        });
        fbContainer.grab(fbLikeToMove, 'top');

        this.fbLikeDelays.each(function(item, index, array)
        {
            clearTimeout(item);
            array.erase(item);
        });


        if(this.imageShowCounter > 0)
        {
            this.fbLikeDelays[index] = this.removeFBLike.delay(1500, this);
        }
    },

    removeFBLike : function()
    {
        var fbLikeTags = document.id(this.options.facebookContainer).getChildren();

        fbLikeTags.each(function(el,index)
        {
            if(index != 0)
            {
                el.dispose();
            }

        }.bind(this));
    },

    swapTwitterButton : function(index, imageObject)
    {
        var urlToShare = this.getHashUrl(index, imageObject);

        var twitterButton = new Element('a', {'href': 'https://twitter.com/share', 'class': 'twitter-share-button', 'data-url': urlToShare/*, 'data-text': urlToShare*/});
        twitterButton.setStyles
        ({
            position: 'absolute',
            top: 0,
            left: 0
        });
        twitterButton.inject(this.options.twitterButtonDiv, 'top');

        if(typeof(twttr) != 'undefined')
        {
            twttr.widgets.load();
        }

        this.twitterDelays.each(function(item, index, array)
        {
            clearTimeout(item);
            array.erase(item);
        });

        if(this.imageShowCounter > 0)
        {
            this.twitterDelays[index] = this.removeTwitter.delay(1500, this);
        }
    },

    removeTwitter : function()
    {
        var twitterButtons = document.id(this.options.twitterButtonDiv).getChildren();

        twitterButtons.each(function(el,index)
        {
            if(index != 0)
            {
                el.dispose();
            }

        }.bind(this));
    },

    swapPlusOne : function(index, imageObject)
    {
        if(this.options.facebookLegacy == 1)
        {
            var urlToShare = this.getLegacyUrl(index, imageObject);
        }
        else
        {
            var urlToShare = this.getHashUrl(index, imageObject);
        }

        var buttonId = this.options.uniqueid + 'plus_one_button' + this.options.prefix + index;
        var loadingPlusOne = new Element('div', {'id': buttonId, 'class': 'plus_one_button_inj'});
        loadingPlusOne.inject(this.options.plusOneDiv, 'top');

        if(typeof(gapi) != 'undefined')
        {
            gapi.plusone.render(buttonId,{"href": urlToShare, "size": "medium"});
        }

        this.plusOneDelays.each(function(item, index, array)
        {
            clearTimeout(item);
            array.erase(item);
        });

        if(this.imageShowCounter > 0)
        {
            this.plusOneDelays[index] = this.removePlusOne.delay(1500, this);
        }
    },

    removePlusOne : function()
    {
        var plusOneDivs = document.id(this.options.plusOneDiv).getElements('div.plus_one_button_inj');

        plusOneDivs.each(function(el,index)
        {
            if(index != 0)
            {
                el.dispose();
            }

        }.bind(this));
    },

    swapPinterestButton : function(index, imageObject)
    {
        var urlToShare = this.getHashUrl(index, imageObject);
        var imgUrl = this.options.resizePathAbsolute + imageObject.filename;
        var description  = '';

        if( this.chk( document.id(this.options.desContainer) ) )
        {
            var descriptionDivs = document.id(this.options.desContainer).getElements('.des_div');
            descriptionDivs.each(function(el,des_index)
            {
                if(des_index == index)
                {
                    var descriptionRaw = el.get('html');
                    description = descriptionRaw.stripTags();
                }
            });
        }

        description = description.length > 0 ? description : this.options.jsonImages.general[index].alt;

        var href = '//www.pinterest.com/pin/create/button/?url=' + encodeURIComponent(urlToShare) + '&media=' + encodeURIComponent(imgUrl);

        var html = '<div class="pinterest_button_wrapper"><a href="' + href + '" data-pin-do="buttonPin" data-pin-config="beside"><img src="//assets.pinterest.com/images/pidgets/pinit_fg_en_rect_gray_20.png" /></a></div>';

        var pInterestContainer = document.id(this.options.pInterestContainer);
        var pInterestTempContainer = document.id(this.options.pInterestTempContainer);

        pInterestTempContainer.set('html',html);

        if(typeof(window.parsePins) != 'undefined')
        {
            window.parsePins(pInterestTempContainer);
        }

        var pInterestToMove = pInterestTempContainer.getFirst();
        pInterestToMove.setStyles
        ({
            position: 'absolute',
            top: 0,
            left: 0
        });
        pInterestContainer.grab(pInterestToMove, 'top');

        this.pInterestDelays.each(function(item, index, array)
        {
            clearTimeout(item);
            array.erase(item);
        });

        if(this.imageShowCounter > 0)
        {
            this.pInterestDelays[index] = this.removePInterest.delay(1500, this);
        }

        this.setPInterestDescription.delay(1000, this, Array(pInterestToMove, description));
    },

    removePInterest : function()
    {
        var pInterestTags = document.id(this.options.pInterestContainer).getChildren();

        pInterestTags.each(function(el,index)
        {
            if(index != 0)
            {
                el.dispose();
            }

        }.bind(this));
    },

    setPInterestDescription : function(button, description)
    {
        if(description.length > 0)
        {
            var buttonHref = button.getElement('a').get('data-pin-href');

            if(buttonHref.indexOf('description=') != -1)
            {
                var parts = buttonHref.split('description=');
                if(parts.getLast().indexOf('&') == -1)
                {
                    newHref = parts[0] + 'description=' + encodeURIComponent(description);
                    button.getElement('a').set('data-pin-href', newHref);
                }
            }
            else
            {
                newHref = buttonHref + encodeURIComponent('&description=' + description);
                button.getElement('a').set('data-pin-href', newHref);
            }
        }
    },

    getLegacyUrl : function(index, imageObject)
    {
        var currentUrl = window.location.href;
        if(currentUrl.indexOf("#") > -1)
        {
            currentUrl = currentUrl.substr(0, currentUrl.indexOf("#"));
        }

        if(currentUrl.indexOf("&fb_comment_id") > -1)
        {
            currentUrl = currentUrl.substr(0, currentUrl.indexOf("&fb_comment_id"));
        }

        if(currentUrl.indexOf("?_escaped_fragment_") > -1)
        {
            currentUrl = currentUrl.substr(0, currentUrl.indexOf("?_escaped_fragment_"));
        }

        var urlSymbol = currentUrl.indexOf("?") > -1 ? '&' : '?';

        var slashPos = imageObject.filename.indexOf('/');
        var fileNameOnly  = imageObject.filename.substr(slashPos + 1);
        var dashPos = fileNameOnly.indexOf('-');
        var fileNameClean  = fileNameOnly.substr(0, dashPos);

        var legacyUrl = currentUrl + urlSymbol + 'image=' + fileNameClean;

        return legacyUrl;
    },

    getHashUrl : function(index, imageObject)
    {
        var currentUrl = window.location.href;
        if(currentUrl.indexOf("#") > -1)
        {
            currentUrl = currentUrl.substr(0, currentUrl.indexOf("#"));
        }

        if(currentUrl.indexOf("&fb_comment_id") > -1)
        {
            currentUrl = currentUrl.substr(0, currentUrl.indexOf("&fb_comment_id"));
        }

        if(currentUrl.indexOf("?_escaped_fragment_") > -1)
        {
            currentUrl = currentUrl.substr(0, currentUrl.indexOf("?_escaped_fragment_"));
        }

        var slashPos = imageObject.filename.indexOf('/');
        var fileNameOnly  = imageObject.filename.substr(slashPos + 1);
        var dashPos = fileNameOnly.indexOf('-');
        var fileNameClean  = fileNameOnly.substr(0, dashPos);
        var hashToAdd = '#!' + fileNameClean;
        var hashUrl = currentUrl + hashToAdd;

        return hashUrl;
    },
	
	swapJcomments : function(index, imageObject)
	{
		if(typeof(jcomments) != 'undefined')
		{
			jcomments.showPage(this.options.idArray[index],'com_igallery',0);
			
			if(! this.chk( document.id('comments-form') ) )
			{
				if( this.chk( document.id('addcomments') ) )
				{
					var addCommentLink = document.id('addcomments');
					addCommentLink.setProperty('onclick', "jcomments.showForm(" + this.options.idArray[index] + ",'com_igallery\', 'comments-form-link'); return false;");
				}
			}
			else
			{
				var objectIdInput = document.id('comments-form').getElement('input[name=object_id]');
				objectIdInput.setProperty('value', this.options.idArray[index]);
				
				var jcforms = document.id('jc').getElements('form#comments-form');
				jcforms.each(function(el,index)
				{
					if(index != 0)
					{
						el.dispose();
					}
				});
			}
		}
	},
	
	swapFbComments : function(index, imageObject)
	{
        if(this.options.facebookLegacy == 1)
        {
            var urlToShare = this.getLegacyUrl(index, imageObject);
        }
        else
        {
            var urlToShare = this.getHashUrl(index, imageObject);
        }
		
		if(this.chk( document.id(this.options.facebookCommentsContainer) ))
        {

            var fbContainer = document.id(this.options.facebookCommentsContainer);
            var tempContainerId = this.options.facebookCommentsContainer + '_temp';
            var fbTempContainer = document.id(tempContainerId);

            var fbWidth = fbContainer.getSize().x - 28;
            var fbHtml = '<fb:comments href="' + urlToShare + '" num_posts="' + this.options.facebookCommentsNumPosts + '" width="100%" colorscheme="' + this.options.facebookColor + '"></fb:comments>';

            fbTempContainer.set('html',fbHtml);

            if(typeof(FB) != 'undefined')
            {
                FB.XFBML.parse(fbTempContainer);
            }

            var fbCommentToMove = fbTempContainer.getFirst();
            var position = this.firstShow ? 'relative' : 'absolute';
            fbCommentToMove.setStyles
            ({
                position: position,
                top: 0,
                left: 0,
                visibility: 'hidden'
            });
            fbContainer.grab(fbCommentToMove, 'top');

            this.fbCommentDelays.each(function(item, index, array)
            {
                clearTimeout(item);
                array.erase(item);
            });


            if(this.imageShowCounter > 0)
            {
                this.fbCommentDelays[index] = this.removeFBComment.delay(1500, this);
            }
            else
            {
                fbCommentToMove.setStyle('visibility', 'visible');
            }
        }
		
	},

    removeFBComment : function()
    {
        var fbCommentTags = document.id(this.options.facebookCommentsContainer).getChildren();

        fbCommentTags.each(function(el,index)
        {
            if(index != 0)
            {
                el.dispose();
            }
            else
            {
                el.setStyle('visibility', 'visible');
                el.setStyle('position', 'relative');
            }

        }.bind(this));
    },
	
	resetLboxHeight : function()
	{
		var totalScrollHeight = window.getScrollHeight();
		document.id(this.options.lboxDark).setStyle('height',totalScrollHeight);
	},
	
	
	swapReportImage : function(index)
	{
		document.id(this.options.reportContainer).setStyle('height',this.reportContainerHeight);
		var reportForm = document.id(this.options.reportContainer).getElement('form');
		reportForm.setStyle('display', 'none');
		
		var reportUrl = this.options.host + 'index.php?option=com_igallery&task=imagefront.reportImage&id=' + this.options.idArray[index] + '&catid=' + this.options.catid;
		reportForm.setProperty('action', reportUrl);
		
		var reportLink = document.id(this.options.reportContainer).getElement('a');
		reportLink.removeEvents();
		reportLink.addEvent('click', function(event)
		{
            event.stop();
            document.id(this.options.reportContainer).setStyle('height','auto');
			reportForm.setStyle('display', 'block');
		}.bind(this));
	},
	
	swapNumbering : function(index)
	{
		if( this.chk( document.id(this.options.numberingContainer) ) )
		{
			document.id(this.options.numberingContainer).getElement('span').set('html', index + 1);
		}
	},

    swapImageAuthor : function(index)
    {
        if( this.chk( document.id(this.options.imageAuthorContainer) ) )
        {
            document.id(this.options.imageAuthorContainer).getElement('span').set('html', this.options.jsonImages.general[index].author);
        }
    },

    swapImageHits : function(index)
    {
        if( this.chk( document.id(this.options.imageHitsContainer) ) )
        {
            document.id(this.options.imageHitsContainer).getElement('span').set('html', this.options.jsonImages.general[index].hits);
        }
    },
	
	swapDownload : function(index)
	{
		if( this.chk( document.id(this.options.downloadId) ) )
		{
			var downloadLink = document.id(this.options.downloadId).getElement('a');
			var linkType = this.options.main == 1 ? 'main' : 'lbox';
			var url = this.options.host + 'index.php?option=com_igallery&task=imagefront.download&format=raw&type=' + linkType + '&id=' + this.options.idArray[index];
			downloadLink.setProperty('href',url);
		}
	},
	
	swapRatings : function(index, hideMessage)
	{
        if( this.chk(document.id(this.options.ratingsContainer)) )
        {
            if(hideMessage == true)
            {
                document.id(this.options.ratingsContainer).getElement('span.rating_message').set('html','');
            }

            document.id(this.options.ratingsContainer).getElement('span.rating_loading_gif').setStyle('visibility', 'hidden');
            var width = this.options.jsonImages.general[index].ratingAverage * 20;

            document.id(this.options.ratingsContainer).getElement('div.ratings_current').setStyle('width', width + '%');

            document.id(this.options.ratingsContainer).getElement('span.rating_number').set('html',this.options.jsonImages.general[index].ratingAverage);

            document.id(this.options.ratingsContainer).getElement('span.rating_count').set('html',this.options.jsonImages.general[index].ratingCount);

            if(this.options.jsonImages.general[index].ratingCount == 1)
            {
                document.id(this.options.ratingsContainer).getElement('span.rating_vote_vote').setStyle('display', 'inline');
                document.id(this.options.ratingsContainer).getElement('span.rating_vote_votes').setStyle('display', 'none');
            }
            else
            {
                document.id(this.options.ratingsContainer).getElement('span.rating_vote_vote').setStyle('display', 'none');
                document.id(this.options.ratingsContainer).getElement('span.rating_vote_votes').setStyle('display', 'inline');
            }
        }
	},
	
	addImageHit : function()
	{
		var hitUrl = this.options.host + 'index.php?option=com_igallery&task=imagefront.addHit&format=raw&id=' + this.options.idArray[this.imageIndex];
		var hitAjax = new Request({url: hitUrl, method: 'get', 
		onComplete: function(response){}.bind(this)});
		    
		hitAjax.send();
	},

    setLboxWidth: function()
    {
        var windowWidth = window.getWidth();
        var windowHeight = window.getSize().y;

        if(windowWidth != this.lastWindowWidth || windowHeight != this.lastWindowHeight)
        {
            var lboxPaddingLeft = document.id(this.options.lboxWhite).getStyle('padding-left').toInt();
            var lboxPaddingRight = document.id(this.options.lboxWhite).getStyle('padding-right').toInt();
            var lboxWidthNoPadding = this.options.lightboxWidth;
            var lboxWidthWithPadding = this.options.lightboxWidth + lboxPaddingLeft + lboxPaddingRight;
            var lboxMargin = 30;
            var windowHeightSpace = windowHeight - (lboxMargin * 2);

            if(this.lboxFullHeight == 0)
            {
                this.lboxFullHeight = document.id(this.lboxGalleryObject.options.imageSlideshowContainer).measure(function()
                {
                    return this.getSize().y + 30;
                });

                if(this.lboxGalleryObject.options.thumbPostion == 'above' || this.lboxGalleryObject.options.thumbPostion == 'below')
                {
                    if( this.chk( document.id(this.lboxGalleryObject.options.thumbContainer ) ) )
                    {
                        this.lboxFullHeight =  this.lboxFullHeight + 40 + document.id(this.lboxGalleryObject.options.thumbContainer).measure(function()
                        {
                            return this.getSize().y;
                        });
                    }
                }

                if(this.lboxGalleryObject.options.showDescriptions == 1)
                {
                    if(this.lboxGalleryObject.options.desPostion == 'above' || this.lboxGalleryObject.options.desPostion == 'below')
                    {
                        if( this.chk( document.id(this.lboxGalleryObject.options.desContainer ) ) )
                        {
                            this.lboxFullHeight =  this.lboxFullHeight + 20 + document.id(this.lboxGalleryObject.options.desContainer).measure(function()
                            {
                                return this.getSize().y;
                            });
                        }
                    }
                }
            }

            if(lboxWidthWithPadding < (windowWidth - (lboxMargin * 2) ) )
            {
                var whiteDivWidth = lboxWidthNoPadding;
                var whiteDivLeftMargin = (windowWidth - lboxWidthWithPadding) / 2;
            }
            else
            {
                var whiteDivWidth = windowWidth - ( (lboxMargin * 2) + lboxPaddingLeft + lboxPaddingRight);
                var whiteDivLeftMargin = lboxMargin;
            }

            if(this.lboxFullHeight > windowHeightSpace )
            {
                var ratio = windowHeightSpace/this.lboxFullHeight;

                if(lboxWidthNoPadding * ratio < whiteDivWidth)
                {
                    whiteDivWidth = lboxWidthNoPadding * ratio;
                    if(whiteDivWidth < (windowWidth - (lboxMargin * 2) ) )
                    {
                        var whiteDivLeftMargin = (windowWidth - (whiteDivWidth + lboxPaddingLeft + lboxPaddingRight)) / 2;
                    }
                    else
                    {
                        var whiteDivLeftMargin = lboxMargin;
                    }
                }
            }


            var html = $$('html');
            var txtDirection = html.getProperty('dir');
            if(txtDirection == 'rtl')
            {
                document.id(this.options.lboxWhite).setStyles
                ({
                    'width': whiteDivWidth,
                    'margin-right': whiteDivLeftMargin
                });
            }
            else
            {
                document.id(this.options.lboxWhite).setStyles
                ({
                    'width': whiteDivWidth,
                    'margin-left': whiteDivLeftMargin
                });
            }

            this.lastWindowWidth = windowWidth;
            this.lastWindowHeight = windowHeight;
        }
    },
  
	showLightBox : function(index)
	{
        this.lboxGalleryObject.imageIndex = index;
        this.lboxGalleryObject.checkHash(false);

        this.clearSlideShow();

        if(this.options.refreshMode == 'hash')
        {
            this.lboxGalleryObject.setCheckHashPeriodical();
            this.clearCheckHashPeriodical();
        }

		if(this.lboxGalleryObject.options.preload == 1 && this.lboxPreloadStarted == false)
		{
			this.lboxGalleryObject.lboxPreloadStarter();
			this.lboxPreloadStarted = true;
		}
		
		var bodyTag = document.getElementsByTagName("body").item(0);
		var scrolledDown = window.getScrollTop();
		var totalScrollHeight = window.getScrollHeight();
		var windowWidth = window.getWidth();
		var windowHeight = window.getHeight();
		var lboxPaddingLeft = document.id(this.options.lboxWhite).getStyle('padding-left').toInt();
		var lboxPaddingRight = document.id(this.options.lboxWhite).getStyle('padding-right').toInt();
		var lboxPadding = (lboxPaddingLeft + lboxPaddingRight) / 2;

        this.setLboxWidth();
        this.setLboxWidthPeriodical = this.setLboxWidth.periodical(600, this);

		if(this.lightboxShowCounter == 0)
		{
			document.id(this.options.lboxWhite).inject(bodyTag, 'top');
		}

		document.id(this.options.lboxWhite).setStyles
		({
			'top': scrolledDown + 30,
			'opacity': '0',
			'display': 'block'
		});
		
		totalScrollHeight = window.getScrollHeight();
		
		document.id(this.options.lboxDark).inject(bodyTag, 'top');
		document.id(this.options.lboxDark).setStyles
		({
            'height': totalScrollHeight,
            'opacity': '0.01',
			'display': 'block'
		});

        this.resetLboxHeightPeriodical = this.resetLboxHeight.periodical(750, this);


        if(this.lboxGalleryObject.options.thumbPostion == 'above' || this.lboxGalleryObject.options.thumbPostion == 'below')
        {

        }
        else
        {
            this.lboxSetThumbContainerHeightPeriodical = this.lboxSetThumbContainerHeight.periodical(500, this);
        }

        if(this.lboxGalleryObject.options.desPostion == 'left' || this.lboxGalleryObject.options.desPostion == 'right')
        {
            this.lboxSetDesContainerHeightPeriodical = this.lboxSetDesContainerHeight.periodical(500, this);
        }
		
		var targetOpacity = this.options.lightboxBackOpacity/100;
        var darkDivFade = new Fx.Tween(document.id(this.options.lboxDark), {property:'opacity', duration: 200});
		darkDivFade.start(0.01,targetOpacity);
		
		var whiteDivFadeIn = new Fx.Tween(document.id(this.options.lboxWhite), {property:'opacity', duration: 200});
		whiteDivFadeIn.start(0,1);
		
		if(this.lboxGalleryObject.options.allowComments == 2 && this.options.allowComments == 2)
		{
			var jcommentsClone = document.id('jc').clone(true, true);
			document.id('jc').dispose();
			
			jcommentsClone.inject(this.options.jCommentsLbox);
			this.totalScrollHeight = window.getScrollHeight();
			document.id(this.options.lboxDark).setStyle('height', this.totalScrollHeight);
		}
		
		this.lboxGalleryObject.swapImage(this.options.jsonImages.lbox[this.lboxGalleryObject.imageIndex], 0, this.lboxGalleryObject.imageIndex, true);
		
		if(this.lboxGalleryObject.options.allowComments == 2 && this.options.allowComments == 2)
		{
			var jcforms = document.id('jc').getElements('form#comments-form');
			jcforms.each(function(el,index)
			{
				if(index != 0)
				{
					el.dispose();
				}
			});
		}
		
		this.lboxGalleryObject.initializeSlideShow();

		if(this.lboxGalleryObject.options.allowRating == 2 && this.lightboxShowCounter == 0)
        {
		    this.lboxGalleryObject.initializeRating();
        }
		
		if( !(this.lboxGalleryObject.options.slideshowPosition == 'left-right' && this.lboxGalleryObject.options.showSlideshowControls == 1) )
        {
            document.id(this.lboxGalleryObject.options.largeImage).removeEvents('click');
            document.id(this.lboxGalleryObject.options.largeImage).addEvent('click', function(e)
            {
                this.lboxGalleryObject.clearSlideShow();
                this.lboxGalleryObject.slideShowSwap(true);
            }.bind(this));
        }
		
		if(this.lboxGalleryObject.options.showThumbs == 1)
		{
			this.lboxGalleryObject.initializeThumbs(this.lboxGalleryObject.imageIndex, this.lightboxShowCounter);
		}

		this.setLboxImageDivHeightPeriodical = this.setLboxImageDivHeight.periodical(500, this);
		
		document.removeEvent('keydown', this.boundAddKeyEvent);
		this.lboxBoundAddKeyEvent = this.lboxGalleryObject.addKeyEvent.bind(this.lboxGalleryObject);
		document.addEvent('keydown', this.lboxBoundAddKeyEvent);
		
		if(this.chk(document.id(this.lboxGalleryObject.options.closeImage)))
		{
			document.id(this.lboxGalleryObject.options.closeImage).removeEvents();
			
			document.id(this.lboxGalleryObject.options.closeImage).addEvent('click', function(e)
			{
				this.closeLightBox(this.lboxGalleryObject.imageIndex);
			}.bind(this));
		}
		
		document.id(this.options.lboxDark).removeEvents();
		document.id(this.options.lboxDark).addEvent('click', function(e)
		{
			this.closeLightBox(this.lboxGalleryObject.imageIndex);
		}.bind(this));
		
		this.lightboxShowCounter++;

        if(this.options.showLargeImage == 0 && this.options.refreshMode == 'hash')
        {
            if(window.location.hash.length == 0)
            {
                this.addHash(this.options.jsonImagesImageType[this.lboxGalleryObject.imageIndex]);
            }
        }
		
	},
	
	closeLightBox : function(index)
	{
        if(this.options.refreshMode == 'hash')
        {
            this.lboxGalleryObject.clearCheckHashPeriodical();

            if(this.options.showLargeImage == 1)
            {
                this.setCheckHashPeriodical();
            }

        }

		this.lboxGalleryObject.clearSlideShow();
		this.lboxGalleryObject.lastImageDisplayedIndex = -1;
		
		if(this.lboxGalleryObject.options.allowComments == 2 && this.options.allowComments == 2)
		{
			var jcommentsClone = document.id('jc').clone(true, true);
			document.id('jc').dispose();
			jcommentsClone.inject(this.options.jCommentsMain);
			
			jcomments.showPage(this.options.idArray[this.imageIndex],'com_igallery',0);
			
			if(! this.chk( document.id('comments-form') ) )
			{
				if( this.chk( document.id('addcomments') ) )
				{
					var addCommentLink = document.id('addcomments');
					addCommentLink.setProperty('onclick', "jcomments.showForm(" + this.options.idArray[this.imageIndex] + ",'com_igallery\', 'comments-form-link'); return false;");
				}
			}
			else
			{
				var objectIdInput = document.id('comments-form').getElement('input[name=object_id]');
				objectIdInput.setProperty('value', this.options.idArray[this.imageIndex]);
				
				var jcforms = document.id('jc').getElements('form#comments-form');
				jcforms.each(function(el,index)
				{
					if(index != 0)
					{
						el.dispose();
					}
				});
			}
		}

        var targetOpacity = this.options.lightboxBackOpacity/100;
        var darkDivFade = new Fx.Tween(document.id(this.options.lboxDark), {property:'opacity', duration: 50});
		darkDivFade.start(targetOpacity,0).chain(function()
		{
			document.id(this.options.lboxDark).setStyle('display','none');
		}.bind(this));
		
		var whiteDivFadeIn = new Fx.Tween(document.id(this.options.lboxWhite), {property:'opacity', duration: 50});
		whiteDivFadeIn.start(1,0).chain(function()
		{

			var imageDivs = document.id(this.lboxGalleryObject.options.largeImage).getElements('div.large_img_holder');
			imageDivs.each(function(el,index)
            {
                el.dispose();
            });
			document.id(this.options.lboxWhite).setStyle('display','none');
		}.bind(this));
		
		document.removeEvent('keydown', this.lboxBoundAddKeyEvent);
		if(this.options.showLargeImage == 1)
		{
			this.boundAddKeyEvent = this.addKeyEvent.bind(this);
			document.addEvent('keydown', this.boundAddKeyEvent);

            this.swapImage(this.options.jsonImagesImageType[this.lboxGalleryObject.imageIndex], 50, this.lboxGalleryObject.imageIndex, true);
		}

		if(this.options.showLargeImage == 0 && this.options.refreshMode == 'hash')
        {
            window.location.hash = '!';
        }

        this.lboxGalleryObject.firstShow = true;
	},

    chk : function(obj)
    {
        return !!(obj || obj === 0);
    }
};

/*
 mootools.more dependencies
 copyrights:[MooTools](http://mootools.net)
 script: Element.Measure.js,Fx.Scroll.js,Assets.js,String.Extras
 */
(function(){var b=function(e,d){var f=[];Object.each(d,function(g){Object.each(g,function(h){e.each(function(i){f.push(i+"-"+h+(i=="border"?"-width":""));
});});});return f;};var c=function(f,e){var d=0;Object.each(e,function(h,g){if(g.test(f)){d=d+h.toInt();}});return d;};var a=function(d){return !!(!d||d.offsetHeight||d.offsetWidth);
};Element.implement({measure:function(h){if(a(this)){return h.call(this);}var g=this.getParent(),e=[];while(!a(g)&&g!=document.body){e.push(g.expose());
    g=g.getParent();}var f=this.expose(),d=h.call(this);f();e.each(function(i){i();});return d;},expose:function(){if(this.getStyle("display")!="none"){return function(){};
}var d=this.style.cssText;this.setStyles({display:"block",position:"absolute",visibility:"hidden"});return function(){this.style.cssText=d;}.bind(this);
},getDimensions:function(d){d=Object.merge({computeSize:false},d);var i={x:0,y:0};var h=function(j,e){return(e.computeSize)?j.getComputedSize(e):j.getSize();
};var f=this.getParent("body");if(f&&this.getStyle("display")=="none"){i=this.measure(function(){return h(this,d);});}else{if(f){try{i=h(this,d);}catch(g){}}}return Object.append(i,(i.x||i.x===0)?{width:i.x,height:i.y}:{x:i.width,y:i.height});
},getComputedSize:function(d){d=Object.merge({styles:["padding","border"],planes:{height:["top","bottom"],width:["left","right"]},mode:"both"},d);var g={},e={width:0,height:0},f;
    if(d.mode=="vertical"){delete e.width;delete d.planes.width;}else{if(d.mode=="horizontal"){delete e.height;delete d.planes.height;}}b(d.styles,d.planes).each(function(h){g[h]=this.getStyle(h).toInt();
    },this);Object.each(d.planes,function(i,h){var k=h.capitalize(),j=this.getStyle(h);if(j=="auto"&&!f){f=this.getDimensions();}j=g[h]=(j=="auto")?f[h]:j.toInt();
        e["total"+k]=j;i.each(function(m){var l=c(m,g);e["computed"+m.capitalize()]=l;e["total"+k]+=l;});},this);return Object.append(e,g);}});})();(function(){Fx.Scroll=new Class({Extends:Fx,options:{offset:{x:0,y:0},wheelStops:true},initialize:function(c,b){this.element=this.subject=document.id(c);
    this.parent(b);if(typeOf(this.element)!="element"){this.element=document.id(this.element.getDocument().body);}if(this.options.wheelStops){var d=this.element,e=this.cancel.pass(false,this);
        this.addEvent("start",function(){d.addEvent("mousewheel",e);},true);this.addEvent("complete",function(){d.removeEvent("mousewheel",e);},true);}},set:function(){var b=Array.flatten(arguments);
    if(Browser.firefox){b=[Math.round(b[0]),Math.round(b[1])];}this.element.scrollTo(b[0],b[1]);return this;},compute:function(d,c,b){return[0,1].map(function(e){return Fx.compute(d[e],c[e],b);
});},start:function(c,d){if(!this.check(c,d)){return this;}var b=this.element.getScroll();return this.parent([b.x,b.y],[c,d]);},calculateScroll:function(g,f){var d=this.element,b=d.getScrollSize(),h=d.getScroll(),j=d.getSize(),c=this.options.offset,i={x:g,y:f};
    for(var e in i){if(!i[e]&&i[e]!==0){i[e]=h[e];}if(typeOf(i[e])!="number"){i[e]=b[e]-j[e];}i[e]+=c[e];}return[i.x,i.y];},toTop:function(){return this.start.apply(this,this.calculateScroll(false,0));
},toLeft:function(){return this.start.apply(this,this.calculateScroll(0,false));},toRight:function(){return this.start.apply(this,this.calculateScroll("right",false));
},toBottom:function(){return this.start.apply(this,this.calculateScroll(false,"bottom"));},toElement:function(d,e){e=e?Array.from(e):["x","y"];var c=a(this.element)?{x:0,y:0}:this.element.getScroll();
    var b=Object.map(document.id(d).getPosition(this.element),function(g,f){return e.contains(f)?g+c[f]:false;});return this.start.apply(this,this.calculateScroll(b.x,b.y));
},toElementEdge:function(d,g,e){g=g?Array.from(g):["x","y"];d=document.id(d);var i={},f=d.getPosition(this.element),j=d.getSize(),h=this.element.getScroll(),b=this.element.getSize(),c={x:f.x+j.x,y:f.y+j.y};
    ["x","y"].each(function(k){if(g.contains(k)){if(c[k]>h[k]+b[k]){i[k]=c[k]-b[k];}if(f[k]<h[k]){i[k]=f[k];}}if(i[k]==null){i[k]=h[k];}if(e&&e[k]){i[k]=i[k]+e[k];
    }},this);if(i.x!=h.x||i.y!=h.y){this.start(i.x,i.y);}return this;},toElementCenter:function(e,f,h){f=f?Array.from(f):["x","y"];e=document.id(e);var i={},c=e.getPosition(this.element),d=e.getSize(),b=this.element.getScroll(),g=this.element.getSize();
    ["x","y"].each(function(j){if(f.contains(j)){i[j]=c[j]-(g[j]-d[j])/2;}if(i[j]==null){i[j]=b[j];}if(h&&h[j]){i[j]=i[j]+h[j];}},this);if(i.x!=b.x||i.y!=b.y){this.start(i.x,i.y);
    }return this;}});function a(b){return(/^(?:body|html)$/i).test(b.tagName);}})();var Asset={javascript:function(d,b){if(!b){b={};}var a=new Element("script",{src:d,type:"text/javascript"}),e=b.document||document,c=b.onload||b.onLoad;
    delete b.onload;delete b.onLoad;delete b.document;if(c){if(typeof a.onreadystatechange!="undefined"){a.addEvent("readystatechange",function(){if(["loaded","complete"].contains(this.readyState)){c.call(this);
    }});}else{a.addEvent("load",c);}}return a.set(b).inject(e.head);},css:function(d,a){if(!a){a={};}var b=new Element("link",{rel:"stylesheet",media:"screen",type:"text/css",href:d});
    var c=a.onload||a.onLoad,e=a.document||document;delete a.onload;delete a.onLoad;delete a.document;if(c){b.addEvent("load",c);}return b.set(a).inject(e.head);
},image:function(c,b){if(!b){b={};}var d=new Image(),a=document.id(d)||new Element("img");["load","abort","error"].each(function(e){var g="on"+e,f="on"+e.capitalize(),h=b[g]||b[f]||function(){};
    delete b[f];delete b[g];d[g]=function(){if(!d){return;}if(!a.parentNode){a.width=d.width;a.height=d.height;}d=d.onload=d.onabort=d.onerror=null;h.delay(1,a,a);
        a.fireEvent(e,a,1);};});d.src=a.src=c;if(d&&d.complete){d.onload.delay(1);}return a.set(b);},images:function(c,b){c=Array.from(c);var d=function(){},a=0;
    b=Object.merge({onComplete:d,onProgress:d,onError:d,properties:{}},b);return new Elements(c.map(function(f,e){return Asset.image(f,Object.append(b.properties,{onload:function(){a++;
        b.onProgress.call(this,a,e,f);if(a==c.length){b.onComplete();}},onerror:function(){a++;b.onError.call(this,a,e,f);if(a==c.length){b.onComplete();}}}));
    }));}};
(function(){var e={a:/[àáâãäåăą]/g,A:/[ÀÁÂÃÄÅĂĄ]/g,c:/[ćčç]/g,C:/[ĆČÇ]/g,d:/[ďđ]/g,D:/[ĎÐ]/g,e:/[èéêëěę]/g,E:/[ÈÉÊËĚĘ]/g,g:/[ğ]/g,G:/[Ğ]/g,i:/[ìíîï]/g,I:/[ÌÍÎÏ]/g,l:/[ĺľł]/g,L:/[ĹĽŁ]/g,n:/[ñňń]/g,N:/[ÑŇŃ]/g,o:/[òóôõöøő]/g,O:/[ÒÓÔÕÖØ]/g,r:/[řŕ]/g,R:/[ŘŔ]/g,s:/[ššş]/g,S:/[ŠŞŚ]/g,t:/[ťţ]/g,T:/[ŤŢ]/g,u:/[ùúûůüµ]/g,U:/[ÙÚÛŮÜ]/g,y:/[ÿý]/g,Y:/[ŸÝ]/g,z:/[žźż]/g,Z:/[ŽŹŻ]/g,th:/[þ]/g,TH:/[Þ]/g,dh:/[ð]/g,DH:/[Ð]/g,ss:/[ß]/g,oe:/[œ]/g,OE:/[Œ]/g,ae:/[æ]/g,AE:/[Æ]/g},d={" ":/[\xa0\u2002\u2003\u2009]/g,"*":/[\xb7]/g,"'":/[\u2018\u2019]/g,'"':/[\u201c\u201d]/g,"...":/[\u2026]/g,"-":/[\u2013]/g,"&raquo;":/[\uFFFD]/g},c={ms:1,s:1000,m:60000,h:3600000},b=/(\d*.?\d+)([msh]+)/;
    var a=function(h,j){var g=h,i;for(i in j){g=g.replace(j[i],i);}return g;};var f=function(g,i){g=g||"";var j=i?"<"+g+"(?!\\w)[^>]*>([\\s\\S]*?)</"+g+"(?!\\w)>":"</?"+g+"([^>]+)?>",h=new RegExp(j,"gi");
        return h;};String.implement({standardize:function(){return a(this,e);},repeat:function(g){return new Array(g+1).join(this);},pad:function(g,j,i){if(this.length>=g){return this;
    }var h=(j==null?" ":""+j).repeat(g-this.length).substr(0,g-this.length);if(!i||i=="right"){return this+h;}if(i=="left"){return h+this;}return h.substr(0,(h.length/2).floor())+this+h.substr(0,(h.length/2).ceil());
    },getTags:function(g,h){return this.match(f(g,h))||[];},stripTags:function(g,h){return this.replace(f(g,h),"");},tidy:function(){return a(this,d);},truncate:function(g,h,k){var j=this;
        if(h==null&&arguments.length==1){h="…";}if(j.length>g){j=j.substring(0,g);if(k){var i=j.lastIndexOf(k);if(i!=-1){j=j.substr(0,i);}}if(h){j+=h;}}return j;
    },ms:function(){var g=b.exec(this);if(g==null){return Number(this);}return Number(g[1])*c[g[2]];}});})();

 