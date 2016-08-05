#!/bin/bash
#/*
#=====================================================
# Qad Framework (qad.sh)
#-----------------------------------------------------
# https://pcmasters.ml/
#-----------------------------------------------------
# Copyright (c) 2016 Alex Smith
#=====================================================
#*/
if [ "$1" == "install" ]; then
	echo 'if';
	exit;
fi
if [ "$1" == "" ] || [ "$1" == "help" ]; then
	echo 'Help Qad-cli Fraemwork';
	echo './qad.sh install'; #TODO
	echo './qad.sh min';
	echo './qad.sh clear'; #TODO
	echo './qad.sh name version title [new|key]';
	exit;
elif [ "$1" == "min" ]; then
	pwd=$(pwd);
	mkdir -p '../../upload/color/';
	echo "Scaning direcotry..."
	for odir in `find "../../page/" -type d | grep -v \/\.git\/`
	do
		for filetype in "html"
		do
			for filename in `ls $odir/*.$filetype 2> /dev/null | sed "s/\.$filetype$//g" | grep -v .min$`
			do
				color=$(grep theme-color $filename.$filetype -m 1 | sed 's/.*content="#//g' | sed 's/".*//g');
				qadf=$(grep '<link.*stylesheet/qad' $filename.$filetype -m 1 | sed 's/.*href="//g' | sed 's/".*//g');
				if [ ! -z "$color" ] && [ ! -z "$qadf" ]; then
					cd $pwd'/'$(dirname $filename);
					if [ "$(echo $qadf | grep '://')" ]; then
						echo $filename.$filetype'::'$color'::wget::'$qadf;
						qad='none';
						#wget -O $color'.css' $qadf;
						#qad=$pwd'/'$(dirname $filename)'/'$color'.css';
						cd $pwd;
					else
						echo $filename.$filetype'::'$color'::'$qadf;
						cp $qadf $pwd'/../../upload/color/'$color'.css';
						qad=$pwd'/../../upload/color/'$color'.css';
						cd $pwd;
					fi
					if [ -e "$qad" ]; then
						sed -r 's/@color/#'$color'/g' $qad > $qad'.qad';
						mv $qad'.qad' $qad;
						sed -r 's/@color: meta.theme-color;//g' $qad > $qad'.qad';
						mv $qad'.qad' $qad;
						sed -i '/meta./d' $qad;
						curl -X POST -s --data-urlencode 'input@'$qad 'http://cssminifier.com/raw' > $qad'.qad';
						mv $qad'.qad' $qad;
						if [ "$(echo $qadf | grep '://')" ]; then
							sed -r 's/<link.*stylesheet\/qad.*>/<link type="text\/css" rel="stylesheet" href="'$color'.css" \/>/g' $filename.$filetype > $filename.$filetype.qad;
							sed -r 's/@location\///g' $qad > $qad'.qad';
						else
							sed -r 's/<link.*stylesheet\/qad.*>/<link type="text\/css" rel="stylesheet" href="..\/..\/upload\/color\/'$color'.css" \/>/g' $filename.$filetype > $filename.$filetype.qad;
							sed -r 's/@location\//..\/..\//g' $qad > $qad'.qad';
						fi
						mv $qad'.qad' $qad;
						mv $filename.$filetype'.qad' $filename.$filetype;
						sed ':a;N;$!ba;s/>\s*</></g' $filename.$filetype > $filename.$filetype.qad;
						mv $filename.$filetype.qad $filename.$filetype;
					fi
				fi
			done
		done
	done
	cd $pwd;
	if [ -e 'qad.js' ]; then
		curl -X POST -s --data-urlencode 'input@qad.js' 'http://javascript-minifier.com/raw' > 'qad';
		mv 'qad' 'qad.js';
	fi
	exit;
fi
if [ -z "$2" ]; then exit 0; fi
if [ -z "$3" ]; then exit 0; fi
if [ ! -e "../../page/$1/index.html" ]; then exit 0; fi

company='qwedl';
color=$(cat ../../page/$1/index.html | grep theme-color | sed 's/.*content="//g' | sed 's/".*//g');
orientation=$(cat ../../page/$1/index.html | grep screen-orientation | sed 's/.*content="//g' | sed 's/".*//g');
icon=$(cat ../../page/$1/index.html | grep 'rel="icon"' | sed 's/.*href="//g' | sed 's/".*//g');
dir=$(pwd);

echo 'Inc: '$company;
echo 'App: '$1;
echo 'Version: '$2;
echo 'Title: '$3;
echo 'Color: '$color;
echo 'Orientation: '$orientation;
echo 'Icon: '$icon;
echo 'Dir: '$dir;
echo 'Build: '$dir/../../build/$1/;

cd ~/.config/;
if [ ! -e "android-sdk-linux" ]; then
	sudo apt install android-tools-adb curl openjdk-8-jdk
	wget https://dl.google.com/android/android-sdk_r24.4.1-linux.tgz
	tar xvf android-sdk*.tgz
	rm android-sdk*.tgz
	cd android-sdk-linux/
	wget https://services.gradle.org/distributions/gradle-2.14.1-bin.zip
	unzip gradle*.zip
	rm gradle*.zip
	mv gradle* gradle
	ls
	echo 'export ANDROID_HOME='$(pwd)'/' >> ~/.bashrc
	echo 'export PATH=${PATH}:$ANDROID_HOME/gradle/bin:$ANDROID_HOME/platform-tools:$ANDROID_HOME/tools:$ANDROID_HOME/build-tools/21.1.0/' >> ~/.bashrc
	source ~/.bashrc
	./tools/android update sdk --all --filter android-21,build-tools-23.0.3 --no-ui
fi
if [ -e "/usr/bin/unzip" ] || [ -e "/usr/local/bin/unzip" ]; then
	if [ ! -e "qad" ]; then
		install=true;
		wget https://github.com/alex2844/qad-android/archive/master.zip;
		unzip master.zip;
		rm master.zip;
		mv qad-android-master qad;
	fi
	cd qad;
	mkdir -p ~/.config/qad/app/src/main/assets/www/page/;
	cp -r $dir/../../service-worker.js ~/.config/qad/app/src/main/assets/www/;
	cp -r $dir/../../data ~/.config/qad/app/src/main/assets/www/;
	cp -r $dir/../../page/$1 ~/.config/qad/app/src/main/assets/www/page/;
	rm ~/.config/qad/app/src/main/assets/www/page/$1/*.php;
	rm ~/.config/qad/app/src/main/assets/www/data/qad/*.php;
	rm ~/.config/qad/app/src/main/assets/www/data/qad/*.sh;
	if [ -e "$dir/../../page/$1/libs" ]; then
		cp -r $dir/../../page/$1/libs ~/.config/qad/app/;
		rm -r ~/.config/qad/app/src/main/assets/www/page/$1/libs;
	fi
	if [ -e "$dir/../../page/$1/MainActivity.java" ]; then
		cp -r $dir/../../page/$1/MainActivity.java ~/.config/qad/app/src/main/java/com/example/app/;
		rm ~/.config/qad/app/src/main/assets/www/page/$1/MainActivity.java;
	fi
	ls;
else
	echo 'error';
	echo 'install unzip';
	exit 0;
fi

cp app/src/main/assets/www/page/$1/$icon app/src/main/res/drawable-hdpi/ic_launcher.png;
cp app/src/main/assets/www/page/$1/$icon app/src/main/res/drawable-mdpi/ic_launcher.png;
cp app/src/main/assets/www/page/$1/$icon app/src/main/res/drawable-xhdpi/ic_launcher.png;
cp app/src/main/assets/www/page/$1/$icon app/src/main/res/drawable-xxhdpi/ic_launcher.png;
sed -r 's/mWebView.loadUrl(.*);/mWebView.loadUrl("file:\/\/\/android_asset\/www\/page\/'$1'\/index.html");/g' app/src/main/java/com/example/app/MainActivity.java > app/src/main/java/com/example/app/MainActivity.gen.java;
mv app/src/main/java/com/example/app/MainActivity.gen.java app/src/main/java/com/example/app/MainActivity.java;
sed -r 's/applicationId ".*"/applicationId "com.'$company'.'$1'"/g' app/build.gradle  > app/build.gen.gradle;
mv app/build.gen.gradle app/build.gradle;
sed -r 's/versionName ".*"/versionName "'$2'"/g' app/build.gradle  > app/build.gen.gradle;
mv app/build.gen.gradle app/build.gradle;
sed -r 's/android:label=".*"/android:label="'$3'"/g' app/src/main/AndroidManifest.xml  > app/src/main/AndroidManifest.gen.xml;
mv app/src/main/AndroidManifest.gen.xml app/src/main/AndroidManifest.xml;
if [ ! -z "$orientation" ]; then
	sed -r 's/android:screenOrientation=".*"/android:screenOrientation="'$orientation'"/g' app/src/main/AndroidManifest.xml  > app/src/main/AndroidManifest.gen.xml;
	mv app/src/main/AndroidManifest.gen.xml app/src/main/AndroidManifest.xml;
fi
sed -r 's/ dev>/>/g' app/src/main/assets/www/page/$1/index.html  > app/src/main/assets/www/page/$1/index.gen.html;
mv app/src/main/assets/www/page/$1/index.gen.html app/src/main/assets/www/page/$1/index.html;
sed -r 's/stylesheet\/qad/stylesheet/g' app/src/main/assets/www/page/$1/index.html  > app/src/main/assets/www/page/$1/index.gen.html;
mv app/src/main/assets/www/page/$1/index.gen.html app/src/main/assets/www/page/$1/index.html;
if [ ! -z "$color" ]; then
	sed -r 's/colorPrimary">.*</colorPrimary">'$color'</g' app/src/main/res/values/styles.xml > app/src/main/res/values/styles.gen.xml;
	mv app/src/main/res/values/styles.gen.xml app/src/main/res/values/styles.xml;
	sed -r 's/colorPrimaryDark">.*</colorPrimaryDark">'$color'</g' app/src/main/res/values/styles.xml > app/src/main/res/values/styles.gen.xml;
	mv app/src/main/res/values/styles.gen.xml app/src/main/res/values/styles.xml;
	sed -r 's/@color/'$color'/g' app/src/main/assets/www/data/qad/qad.css  > app/src/main/assets/www/data/qad/qad.gen.css;
	mv app/src/main/assets/www/data/qad/qad.gen.css app/src/main/assets/www/data/qad/qad.css;
fi
sed -r 's/@location\//..\/..\//g' app/src/main/assets/www/data/qad/qad.css  > app/src/main/assets/www/data/qad/qad.gen.css;
mv app/src/main/assets/www/data/qad/qad.gen.css app/src/main/assets/www/data/qad/qad.css;
sed -r 's/@color: meta.theme-color;//g' app/src/main/assets/www/data/qad/qad.css  > app/src/main/assets/www/data/qad/qad.gen.css;
mv app/src/main/assets/www/data/qad/qad.gen.css app/src/main/assets/www/data/qad/qad.css;
sed -i '/meta./d' app/src/main/assets/www/data/qad/qad.css;
if [ ! -z "$4" ] && [ ! -z "$install" ]; then
	types=(js css)
	declare -A urls
	urls[js]="http://javascript-minifier.com/raw"
	urls[css]="http://cssminifier.com/raw"
	echo "Scaning direcotry..."
	for odir in `find "$HOME/.config/qad/app/src/main/assets/www/" -type d | grep -v \/\.git\/`
	do
		for filetype in "${types[@]}"
		do
			echo "Finding $filetype to be compressed under $odir ..."
			for filename in `ls $odir/*.$filetype 2> /dev/null | sed "s/\.$filetype$//g" | grep -v .min$`
			do
				echo "Compressing $filename.$filetype ..."
				curl -X POST -s --data-urlencode "input@$filename.$filetype" ${urls[$filetype]} > $filename\.min.$filetype
				mv $filename\.min.$filetype $filename\.$filetype
			done
		done
	done
	sed -r 's/\/\/ signingConfig/signingConfig/g' app/build.gradle  > app/build.gen.gradle;
	mv app/build.gen.gradle app/build.gradle;
	if [ "$4" == "new" ]; then
		keytool -genkey -alias $1 -keystore ../.$company'-'$1.jks
		sed -r 's/buildTypes/signingConfigs {\nrelease {\nstoreFile file("..\/..\/.'$company'-'$1'.jks")\nstorePassword new String(System.console().readPassword("\\n\\$ Enter keystore password: "))\nkeyAlias "'$1'"\nkeyPassword new String(System.console().readPassword("\\n\\$ Enter key password: "))\n}\n}\nbuildTypes/g' app/build.gradle  > app/build.gen.gradle;
	fi
	if [ "$4" == "key" ]; then
		sed -r 's/buildTypes/signingConfigs {\nrelease {\nstoreFile file(System.console().readLine("\\n\\$ Enter keystore path: "))\nstorePassword new String(System.console().readPassword("\\n\\$ Enter keystore password: "))\nkeyAlias System.console().readLine("\\n\\$ Enter key alias: ")\nkeyPassword new String(System.console().readPassword("\\n\\$ Enter key password: "))\n}\n}\nbuildTypes/g' app/build.gradle  > app/build.gen.gradle;
	fi
	mv app/build.gen.gradle app/build.gradle;
	fi
if [ ! -z "$4" ]; then
	rm $dir/../../build/$1/android.apk;
	gradle build && mkdir -p $dir/../../build/$1/ && cp app/build/outputs/apk/app-release.apk $dir/../../build/$1/android.apk && adb install -r $dir/../../build/$1/android.apk && echo $dir/../../build/$1/android.apk;
else
	rm $dir/../../build/$1/android.apk;
	gradle build && adb install -r app/build/outputs/apk/app-debug.apk;
fi
