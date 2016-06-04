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
	echo './qad.sh clear'; #TODO
	echo './qad.sh name version title';
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
if [ -e "/usr/bin/unzip" ] || [ -e "/usr/local/bin/unzip" ]; then
	if [ ! -e "qad" ]; then
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
			do_min=0
			if [ -f $filename\.min\.$filetype ]; then
				orig_ver_time=`eval $LS $filename\.$filetype | awk '{print $6}'`
				mini_ver_time=`eval $LS $filename\.min\.$filetype | awk '{print $6}'`
				if [ $mini_ver_time -lt $orig_ver_time ]; then
					do_min=1
				fi
			else
				do_min=1
			fi
			if [ 0 -lt $do_min ]; then
				echo "Compressing $filename.$filetype ..."
				curl -X POST -s --data-urlencode "input@$filename.$filetype" ${urls[$filetype]} > $filename\.min.$filetype
				mv $filename\.min.$filetype $filename\.$filetype
			fi
		done
	done
done
rm $dir/../../build/$1/android.apk;
gradle build && mkdir -p $dir/../../build/$1/ && cp app/build/outputs/apk/app-debug.apk $dir/../../build/$1/android.apk && adb install -r $dir/../../build/$1/android.apk && echo $dir/../../build/$1/android.apk;
