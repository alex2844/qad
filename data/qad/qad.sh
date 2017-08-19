#!/bin/bash
#/*
#=====================================================
# Qad Framework (qad.sh)
#-----------------------------------------------------
# https://qwedl.com/
#-----------------------------------------------------
# Copyright (c) 2016-2017 Alex Smith
#=====================================================
#*/
if [ "$1" == "install" ]; then
	echo 'if';
	exit;
fi
if [ "$1" == "" ] || [ "$1" == "help" ]; then
	echo 'Help Qad-cli Fraemwork';
	#echo './qad.sh install';
	echo './qad.sh min [project]';
	#echo './qad.sh clear';
	echo './qad.sh project version title [new|key]';
	echo './qad.sh dev';
	exit;
elif [ "$1" == "dev" ]; then
	cd ../../;
	dir=$(pwd);
	cd ~;
	git clone git@github.com:alex2844/qad.git;
	mkdir ~/qad/data/ -p; wget -O ~/qad/index.html https://github.com/alex2844/qad/raw/master/index.html; cp -r $dir/data/qad ~/qad/data/; cp -r $dir/data/fonts ~/qad/data/; cp $dir/service-worker.js ~/qad/; cp $dir/sitemap.php ~/qad/; cd ~/qad/; git status
	echo "alias qad='mkdir ~/qad/data/ -p; wget -O ~/qad/index.html https://github.com/alex2844/qad/raw/master/index.html; cp -r $dir/data/qad ~/qad/data/; cp -r $dir/data/fonts ~/qad/data/; cp $dir/service-worker.js ~/qad/; cp $dir/sitemap.php ~/qad/; cd ~/qad/; git status'" >> ~/.bashrc;
elif [ "$1" == "min" ]; then
	pwd=$(pwd);
	mkdir -p '../../upload/color/';
	echo "Scaning direcotry..."
	if [ ! -z "$2" ]; then
		project='../../page/'$2;
	else
		project='../../page/';
	fi
	for odir in `find $project -type d | grep -v \/\.git\/`
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
						curl -X POST -s --data-urlencode 'input@'$qad 'https://cssminifier.com/raw' > $qad'.qad';
						mv $qad'.qad' $qad;
						if [ ! -z "$2" ]; then
							mkdir -p '../../page/'$2'/data/qad/';
							cp $qad '../../page/'$2'/data/qad/qad.min.css';
							qad='../../page/'$2'/data/qad/qad.min.css';
							sed -r 's/<script src=".*qad.js">/<script src="data\/qad\/qad.min.js">/g' $filename.$filetype > $filename.$filetype.qad;
							mv $filename.$filetype'.qad' $filename.$filetype;
							sed -r 's/<link.*stylesheet\/qad.*>/<link type="text\/css" rel="stylesheet" href="data\/qad\/qad.min.css" \/>/g' $filename.$filetype > $filename.$filetype.qad;
							sed -r 's/@location\//..\/..\//g' $qad > $qad'.qad';
						elif [ "$(echo $qadf | grep '://')" ]; then
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
	exit;
	if [ -e 'qad.js' ]; then
		res=`curl -X POST -s --data-urlencode 'input@qad.js' 'http://javascript-minifier.com/raw'` # > 'qad';
		if [ "${res:0:3}" != "502" ]; then
			echo $res > 'qad';
		else
			exit;
		fi
		if [ ! -z "$2" ]; then
			mv 'qad' '../../page/'$2'/data/qad/qad.min.js';
		else
			mv 'qad' 'qad.js';
		fi
	fi
	exit;
fi
if [ -z "$2" ]; then exit 0; fi
if [ -z "$3" ]; then exit 0; fi
if [ ! -e "../../page/$1/index.html" ]; then exit 0; fi

domain='ml';
company='pcmasters';
color=$(cat ../../page/$1/index.html | grep 'name="theme-color"' | sed 's/.*content="//g' | sed 's/".*//g');
orientation=$(cat ../../page/$1/index.html | grep 'name="screen-orientation"' | sed 's/.*content="//g' | sed 's/".*//g');
os=$(cat ../../page/$1/index.html | grep 'name="os"' | sed 's/.*content="//g' | sed 's/".*//g');
#icon=$(cat ../../page/$1/index.html | grep 'rel="icon"' | sed 's/.*href="//g' | sed 's/".*//g');
dir=$(pwd);
date=`date +%y%m%d%H%M`;

echo 'Inc: '$company;
echo 'Domain: '$domain;
echo 'App: '$1;
echo 'Version: '$2;
echo 'Title: '$3;
echo 'Color: '$color;
echo 'Orientation: '$orientation;
echo 'Os: '$os;
#echo 'Icon: '$icon;
echo 'Dir: '$dir;
echo 'Build: '$dir/../../build/$1/;
echo 'Date: '$date;

cd ~/.config/;
if [ ! -e "nw" ]; then
	sudo apt install zip unzip libc6:i386 libncurses5:i386 libstdc++6:i386 zlib1g:i386 lib32z1
	nw='0.16.1'
	mkdir nw
	cd nw
	wget http://dl.nwjs.io/v$nw/nwjs-v$nw-linux-ia32.tar.gz
	tar xvf *.tar.gz
	rm *.tar.gz
	cd nwjs-*-linux-ia32/lib
	wget https://github.com/iteufel/nwjs-ffmpeg-prebuilt/releases/download/$nw/$nw-linux-ia32.zip
	rm libffmpeg.so
	unzip *.zip
	rm *.zip
	cd ~/.config/nw/
	wget http://dl.nwjs.io/v$nw/nwjs-v$nw-win-ia32.zip
	unzip *win-ia32.zip
	rm *.zip
	cd nwjs-*-win-ia32
	wget https://github.com/iteufel/nwjs-ffmpeg-prebuilt/releases/download/$nw/$nw-win-ia32.zip
	rm ffmpeg.dll
	unzip *.zip
	rm *.zip
	cd ~/.config/nw/
	wget https://github.com/megastep/makeself/raw/master/makeself.sh
	wget https://github.com/megastep/makeself/raw/master/makeself-header.sh
fi
cd ~/.config/
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
	./tools/android update sdk --all --filter android-25,build-tools-25.0.0 --no-ui
fi
cd ~/.config/
if [ -e "/usr/bin/unzip" ] || [ -e "/usr/local/bin/unzip" ]; then
	if [ ! -e "qad" ]; then
		install=true;
		wget https://github.com/alex2844/qad-make/archive/master.zip;
		unzip master.zip;
		rm master.zip;
		mv qad-make-master qad;
	fi
	cd qad;
	mkdir -p ~/.config/qad/app/src/main/assets/www/page/;
	cp -r $dir/../../service-worker.js ~/.config/qad/app/src/main/assets/www/;
	cp -r $dir/../../data ~/.config/qad/app/src/main/assets/www/;
	cp -r $dir/../../page/$1 ~/.config/qad/app/src/main/assets/www/page/;
	rm ~/.config/qad/app/src/main/assets/www/page/$1/*.php;
	rm ~/.config/qad/app/src/main/assets/www/data/*.php;
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
	if [ -e "$dir/../../page/$1/package.json" ]; then
		cp -r $dir/../../page/$1/package.json ~/.config/qad/nw/;
	fi
	ls;
else
	echo 'error';
	echo 'install unzip';
	exit 0;
fi

#cp app/src/main/assets/www/page/$1/$icon app/src/main/res/drawable-hdpi/ic_launcher.png;
#cp app/src/main/assets/www/page/$1/$icon app/src/main/res/drawable-mdpi/ic_launcher.png;
#cp app/src/main/assets/www/page/$1/$icon app/src/main/res/drawable-xhdpi/ic_launcher.png;
#cp app/src/main/assets/www/page/$1/$icon app/src/main/res/drawable-xxhdpi/ic_launcher.png;
#cp app/src/main/assets/www/page/$1/$icon app/src/main/assets/www/icon.png;
#cp app/src/main/assets/www/page/$1/$icon nw/;
cp app/src/main/assets/www/page/$1/qad-icons.zip app/src/main/;
cp app/src/main/assets/www/page/$1/qad-icons.zip nw/;
cd ~/.config/qad/app/src/main/;
unzip -o qad-icons.zip;
rm icon.png qad-icons.zip;
cd ~/.config/qad/nw;
unzip -o qad-icons.zip;
rm -r res qad-icons.zip;
cd ~/.config/qad/;
rm app/src/main/assets/www/page/$1/qad-icons.zip;
sed '0,/mWebView.loadUrl(.*);/s/mWebView.loadUrl(.*);/mWebView.loadUrl("file:\/\/\/android_asset\/www\/page\/'$1'\/index.html");/' -i app/src/main/java/com/example/app/MainActivity.java;
sed -r 's/applicationId ".*"/applicationId "'$domain'.'$company'.'$1'"/g' app/build.gradle  > app/build.gen.gradle;
mv app/build.gen.gradle app/build.gradle;
sed -r 's/versionCode .*/versionCode '$date'/g' app/build.gradle  > app/build.gen.gradle;
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
	sed -r 's/colorPrimary">.*</colorPrimary">'$color'</g' app/src/main/res/values-v21/styles.xml > app/src/main/res/values-v21/styles.gen.xml;
	mv app/src/main/res/values-v21/styles.gen.xml app/src/main/res/values-v21/styles.xml;
	sed -r 's/colorPrimaryDark">.*</colorPrimaryDark">'$color'</g' app/src/main/res/values-v21/styles.xml > app/src/main/res/values-v21/styles.gen.xml;
	mv app/src/main/res/values-v21/styles.gen.xml app/src/main/res/values-v21/styles.xml;
	sed -r 's/@color/'$color'/g' app/src/main/assets/www/data/qad/qad.css  > app/src/main/assets/www/data/qad/qad.gen.css;
	mv app/src/main/assets/www/data/qad/qad.gen.css app/src/main/assets/www/data/qad/qad.css;
fi
sed -r 's/@location\//..\/..\//g' app/src/main/assets/www/data/qad/qad.css  > app/src/main/assets/www/data/qad/qad.gen.css;
mv app/src/main/assets/www/data/qad/qad.gen.css app/src/main/assets/www/data/qad/qad.css;
sed -r 's/@color: meta.theme-color;//g' app/src/main/assets/www/data/qad/qad.css  > app/src/main/assets/www/data/qad/qad.gen.css;
mv app/src/main/assets/www/data/qad/qad.gen.css app/src/main/assets/www/data/qad/qad.css;
sed -i '/meta./d' app/src/main/assets/www/data/qad/qad.css;
sed -r 's/@project/'$1'/g' nw/package.json > nw/package.gen.json;
mv nw/package.gen.json nw/package.json;
sed -r 's/@version/'$2'/g' nw/package.json > nw/package.gen.json;
mv nw/package.gen.json nw/package.json;
sed -r 's/@title/'$3'/g' nw/package.json > nw/package.gen.json;
mv nw/package.gen.json nw/package.json;
sed -r 's/@company/'$company'/g' nw/app.desktop > nw/app.gen.desktop;
mv nw/app.gen.desktop nw/app.desktop;
sed -r 's/@project/'$1'/g' nw/app.desktop > nw/app.gen.desktop;
mv nw/app.gen.desktop nw/app.desktop;
sed -r 's/@version/'$2'/g' nw/app.desktop > nw/app.gen.desktop;
mv nw/app.gen.desktop nw/app.desktop;
sed -r 's/@title/'$3'/g' nw/app.desktop > nw/app.gen.desktop;
mv nw/app.gen.desktop nw/app.desktop;
sed -r 's/@project/'$1'/g' nw/setup.sh > nw/setup.gen.sh;
mv nw/setup.gen.sh nw/setup.sh;
sed -r 's/@version/'$2'/g' nw/setup.sh > nw/setup.gen.sh;
mv nw/setup.gen.sh nw/setup.sh;
sed -r 's/@title/'$3'/g' nw/setup.sh  > nw/setup.gen.sh;
mv nw/setup.gen.sh nw/setup.sh;
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
		keytool -genkey -v -keystore ../.$company'-'$1.keystore -alias $1 -keyalg RSA -keysize 2048 -validity 10000
		sed -r 's/buildTypes/signingConfigs {\nrelease {\nstoreFile file("..\/..\/.'$company'-'$1'.keystore")\nstorePassword new String(System.console().readPassword("\\n\\$ Enter keystore password: "))\nkeyAlias "'$1'"\nkeyPassword new String(System.console().readPassword("\\n\\$ Enter key password: "))\n}\n}\nbuildTypes/g' app/build.gradle  > app/build.gen.gradle;
	fi
	if [ "$4" == "key" ]; then
		sed -r 's/buildTypes/signingConfigs {\nrelease {\nstoreFile file(System.console().readLine("\\n\\$ Enter keystore path: "))\nstorePassword new String(System.console().readPassword("\\n\\$ Enter keystore password: "))\nkeyAlias System.console().readLine("\\n\\$ Enter key alias: ")\nkeyPassword new String(System.console().readPassword("\\n\\$ Enter key password: "))\n}\n}\nbuildTypes/g' app/build.gradle  > app/build.gen.gradle;
	fi
	mv app/build.gen.gradle app/build.gradle;
fi
if [ -z "$os" ] || [ "$(echo $os | grep -io "android")" = "android" ]; then
	rm $dir/../../build/$1/android.apk;
	if [ ! -z "$4" ]; then
		gradle build && mkdir -p $dir/../../build/$1/ && cp app/build/outputs/apk/app-release.apk $dir/../../build/$1/android.apk && apk="$dir/../../build/$1/android.apk";
	else
		gradle build && apk="app/build/outputs/apk/app-debug.apk";
	fi
	if [ "`adb devices | grep device | wc -l`" != "1" ] && [ ! -z "$apk" ]; then
		adb install -r $apk;
	fi
fi
cd app/src/main/assets/www/
cp ../../../../../nw/package.json ./
cp ../../../../../nw/logo.png ./
zip -r ../../../../../nw/app.nw *
cd ../../../../../nw/
if [ -z "$os" ] || [ "$(echo $os | grep -io "linux")" = "linux" ]; then
	cp -r ~/.config/nw/nwjs-*-linux-ia32/ $1-lin/
	#cp icon.png $1-lin/
	cp app.desktop $1-lin/
	cp setup.sh $1-lin/
	cat $1-lin/nw app.nw > $1-lin/app && chmod +x $1-lin/app
	rm $1-lin/nw
	if [ ! -z "$4" ]; then
		bash ~/.config/nw/makeself.sh $1-lin linux.run "$3" bash setup.sh
		rm -r $1-lin
	fi
fi
if [ -z "$os" ] || [ "$(echo $os | grep -io "windows")" = "windows" ]; then
	cp -r ~/.config/nw/nwjs-*-win-ia32/ $1-win/
	#cp icon.png $1-win/
	cat $1-win/nw.exe app.nw > $1-win/app.exe
	rm $1-win/nw.exe
	if [ ! -z "$4" ]; then
		zip -r windows.zip $1-win
		cat unz552xn.exe windows.zip > windows.exe
		rm windows.zip
		zip -A windows.exe
		rm -r $1-win
	fi
fi
if [ -e "/usr/bin/gdrive" ]; then
	cd ~/.config/qad/;
	if [ "`gdrive list -q "name = 'qad-make'" | grep 'qad-make' | wc -l`" == "0" ]; then
		gdrive mkdir qad-make;
	fi
	dm=`gdrive list -q "name = 'qad-make'" | grep 'qad-make' | sed -r 's/ .+//'`;
	echo $dm;
	if [ "`gdrive list -q "name = '$1'" --absolute | grep 'qad-make/' | wc -l`" == "0" ]; then
		gdrive mkdir -p $dm $1;
	fi
	dp=`gdrive list -q "name = '$1'" --absolute | grep 'qad-make/' | sed -r 's/ .+//'`;
	echo $dp;
	if [ -z "$os" ] || [ "$(echo $os | grep -io "android")" = "android" ]; then
		if [ ! -z "$4" ]; then
			mv app/build/outputs/apk/app-release.apk app/build/outputs/apk/android-$date.apk;
		else
			mv app/build/outputs/apk/app-debug.apk app/build/outputs/apk/android-$date.apk;
		fi
		gdrive upload -p $dp 'app/build/outputs/apk/android-'$date'.apk';
	fi
	#if [ ! -z "$4" ]; then
	#	if [ -z "$os" ] || [ "$(echo $os | grep -io "linux")" = "linux" ]; then
	#	fi
	#fi
fi
