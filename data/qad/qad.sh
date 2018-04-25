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

function json() {
	res=$(echo $1 | python -c "import json, sys;
sys.tracebacklimit=0;
try:
	sys.stdout.write(json.dumps(json.load(sys.stdin)$2, sort_keys=True, indent=4))
except IndexError:
	sys.stdout.write('')
except KeyError:
	sys.stdout.write('')");
	res=${res//\"/};
	res=${res//\[/};
	res=${res//\]/};
	echo $res;
}
function qad_min() {
	for file in `find $1 -type f -name "*.js"`; do
		sed -r ':a;$!{N;ba};s|/\*[^*]*\*+([^/*][^*]*\*+)*/||' $file | sed -e '/^$/d' -e ':a; /\\$/N; s/\\\n//; ta' -e "s|/\*\(\\\\\)\?\*/|/~\1~/|g" -e "s|/\*[^*]*\*\+\([^/][^*]*\*\+\)*/||g" -e "s|^//.*$||" -e "s|/\*[^*]*\*\+\([^/][^*]*\*\+\)*/||g" -e "s|/\~\(\\\\\)\?\~/|/*\1*/|g" -e "s|\s\+| |g" -e "s| \([{;,>]\)|\1|g" -e "s|\([{;,>]\) |\1|g" > $file'.qad';
		mv $file'.qad' $file;
		echo 'Qad_min: '$file;
	done
	for file in `find $1 -type f -name "*.css"`; do
		cat $file | sed -e "s|/\*\(\\\\\)\?\*/|/~\1~/|g" -e "s|/\*[^*]*\*\+\([^/][^*]*\*\+\)*/||g" -e "s|\([^:/]\)//.*$|\1|" -e "s|^//.*$||" | tr '\n' ' ' | sed -e "s|/\*[^*]*\*\+\([^/][^*]*\*\+\)*/||g" -e "s|/\~\(\\\\\)\?\~/|/*\1*/|g" -e "s|\s\+| |g" -e "s| \([{;,>]\)|\1|g" -e "s|\([{;,>]\) |\1|g" > $file'.qad';
		mv $file'.qad' $file;
		echo 'Qad_min: '$file;
	done
	for file in `find $1 -type f -name "*.html"`; do
		cat $file | sed -e "s|/\*\(\\\\\)\?\*/|/~\1~/|g" -e "s|/\*[^*]*\*\+\([^/][^*]*\*\+\)*/||g" -e "s|\([^:/]\)//.*$|\1|" -e "s|^//.*$||" | tr '\n' ' ' | sed -e "s|/\*[^*]*\*\+\([^/][^*]*\*\+\)*/||g" -e "s|/\~\(\\\\\)\?\~/|/*\1*/|g" -e "s|\s\+| |g" > $file'.qad';
		mv $file'.qad' $file;
		echo 'Qad_min: '$file;
	done
}

if [ "$1" == "install" ]; then
	echo 'if';
	exit;
fi
if [ "$1" == "" ] || [ "$1" == "help" ]; then
	echo 'Help Qad-cli Fraemwork';
	#echo './qad.sh install';
	echo './qad.sh update';
	echo './qad.sh min [project]';
	#echo './qad.sh clear';
	echo './qad.sh project version title [new|key]';
	echo './qad.sh dev';
	exit;
elif [ "$1" == "update" ]; then
	wget -O qad.css https://github.com/alex2844/qad/raw/master/data/qad/qad.css;
	wget -O qad.js https://github.com/alex2844/qad/raw/master/data/qad/qad.js;
	wget -O qad.php https://github.com/alex2844/qad/raw/master/data/qad/qad.php;
	wget -O qad.sh https://github.com/alex2844/qad/raw/master/data/qad/qad.sh;
	exit;
elif [ "$1" == "dev" ]; then
	cd ../../;
	dir=$(pwd);
	mkdir -p upload/{cache,color,sql};
	cd ~;
	git clone git@github.com:alex2844/qad.git;
	mkdir ~/qad/data/ -p; wget -O ~/qad/index.php https://github.com/alex2844/qad/raw/master/index.php; wget -O ~/qad/index.html https://github.com/alex2844/qad/raw/master/index.html; cp -r $dir/data/qad ~/qad/data/; cp -r $dir/data/fonts ~/qad/data/; cp $dir/service-worker.js ~/qad/; cp $dir/service-worker.php ~/qad/; cp $dir/sitemap.php ~/qad/; cd ~/qad/; git status
	echo "alias qad='mkdir ~/qad/data/ -p; wget -O ~/qad/index.php https://github.com/alex2844/qad/raw/master/index.php; wget -O ~/qad/index.html https://github.com/alex2844/qad/raw/master/index.html; cp -r $dir/data/qad ~/qad/data/; cp -r $dir/data/fonts ~/qad/data/; cp $dir/service-worker.js ~/qad/; cp $dir/service-worker.php ~/qad/; cp $dir/sitemap.php ~/qad/; cd ~/qad/; git status'" >> ~/.bashrc;
elif [ "$1" == "min" ]; then
	pwd=$(pwd);
	mkdir -p '../../upload/color/';
	echo "Scaning direcotry..."
	if [ ! -z "$2" ]; then
		project='../../page/'$2;
	else
		project='../../page/';
	fi
	for odir in `find $project -type d | grep -v \/\.git\/`; do
		for filetype in "html"; do
			for filename in `ls $odir/*.$filetype 2> /dev/null | sed "s/\.$filetype$//g" | grep -v .min$`; do
				color=$(grep theme-color $filename.$filetype -m 1 | sed 's/.*content="#//g' | sed 's/".*//g');
				qadf=$(grep '<link.*stylesheet/qad' $filename.$filetype -m 1 | sed 's/.*href="//g' | sed 's/".*//g');
				if [ ! -z "$color" ] && [ ! -z "$qadf" ]; then
					cd $pwd'/'$(dirname $filename);
					if [ "$(echo $qadf | grep '://')" ]; then
						echo $filename.$filetype'::'$color'::wget::'$qadf;
						qad='none';
						cd $pwd;
					else
						echo $filename.$filetype'::'$color'::'$qadf;
						cp $qadf $pwd'/../../upload/color/'$color'.css';
						qad=$pwd'/../../upload/color/'$color'.css';
						cd $pwd;
					fi
					if [ -e "$qad" ]; then
						sed -r 's/var\(--color\)/#'$color'/g' $qad > $qad'.qad';
						mv $qad'.qad' $qad;
						cat $qad | sed -e "s|/\*\(\\\\\)\?\*/|/~\1~/|g" -e "s|/\*[^*]*\*\+\([^/][^*]*\*\+\)*/||g" -e "s|\([^:/]\)//.*$|\1|" -e "s|^//.*$||" | tr '\n' ' ' | sed -e "s|/\*[^*]*\*\+\([^/][^*]*\*\+\)*/||g" -e "s|/\~\(\\\\\)\?\~/|/*\1*/|g" -e "s|\s\+| |g" -e "s| \([{;:,]\)|\1|g" -e "s|\([{;:,]\) |\1|g" > $qad'.qad'
						mv $qad'.qad' $qad;
						if [ ! -z "$2" ]; then
							mkdir -p '../../page/'$2'/data/qad/';
							cp $qad '../../page/'$2'/data/qad/qad.min.css';
							qad='../../page/'$2'/data/qad/qad.min.css';
							sed -r 's/<script src=".*qad.js">/<script src="data\/qad\/qad.min.js">/g' $filename.$filetype > $filename.$filetype.qad;
							mv $filename.$filetype'.qad' $filename.$filetype;
							sed -r 's/<link.*stylesheet\/qad.*>/<link type="text\/css" rel="stylesheet" href="data\/qad\/qad.min.css" \/>/g' $filename.$filetype > $filename.$filetype.qad;
							sed -r 's/url\(..\//url\(..\/..\/data\//g' $qad > $qad'.qad';
						elif [ "$(echo $qadf | grep '://')" ]; then
							sed -r 's/<link.*stylesheet\/qad.*>/<link type="text\/css" rel="stylesheet" href="'$color'.css" \/>/g' $filename.$filetype > $filename.$filetype.qad;
							sed -r 's/url\(..\//url\(/g' $qad > $qad'.qad';
						else
							sed -r 's/<link.*stylesheet\/qad.*>/<link type="text\/css" rel="stylesheet" href="..\/..\/upload\/color\/'$color'.css" \/>/g' $filename.$filetype > $filename.$filetype.qad;
							sed -r 's/url\(..\//url\(..\/..\/data\//g' $qad > $qad'.qad';
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
	qad_min ../../;
	cd $pwd;
	exit;
fi
if [ -z "$2" ]; then exit 0; fi
if [ -z "$3" ]; then exit 0; fi
if [ ! -e "../../page/$1/index.html" ]; then exit 0; fi

if [ -e "../../page/$1/package.json" ]; then
	package=$(cat ../../page/$1/package.json);
	color=$(json "$package" "['theme_color']");
	orientation=$(json "$package" "['orientation']");
	orientation=${orientation//any/};
	os=$(json "$package" "['os']");
	modules=$(json "$package" "['modules']");
else
	index=$(cat ../../page/$1/index.html);
	color=$(echo "$index" | grep 'name="theme-color"' | sed 's/.*content="//g' | sed 's/".*//g');
	orientation=$(echo "$index" | grep 'name="screen-orientation"' | sed 's/.*content="//g' | sed 's/".*//g');
	os=$(echo "$index" | grep 'name="os"' | sed 's/.*content="//g' | sed 's/".*//g');
fi

domain='com';
company='qwedl';
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
echo 'Modules: '$modules;
echo 'Dir: '$dir;
echo 'Date: '$date;

if [ ! -z "$os" ]; then
	if [ "$(echo $os | grep -io "android")" = "android" ]; then
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
			echo 'export PATH=${PATH}:$ANDROID_HOME/gradle/bin:$ANDROID_HOME/platform-tools:$ANDROID_HOME/tools:$ANDROID_HOME/build-tools/25.0.0/' >> ~/.bashrc
			source ~/.bashrc
			./tools/android update sdk --all --filter android-25,build-tools-25.0.0 --no-ui
		fi
		cd ~/.config/
		if [ -e "/usr/bin/unzip" ] || [ -e "/usr/local/bin/unzip" ]; then
			if [ ! -e "qad" ]; then
				wget https://github.com/alex2844/qad-make/archive/master.zip;
				unzip master.zip;
				rm master.zip;
				mv qad-make-master qad;
			fi
			cd qad;
			cp -r $dir/../../service-worker.js ~/.config/qad/app/src/main/assets/www/;
			mkdir -p ~/.config/qad/app/src/main/assets/www/page/;
			mkdir -p ~/.config/qad/app/src/main/assets/www/data/;
			if [ ! -z "$package" ] && [ ! -z "$modules" ]; then
				mkdir -p ~/.config/qad/app/src/main/assets/www/data/modules/;
				i=0;
				while [ true ]; do
					module=$(json "$package" "['modules'][$i]");
					if [ ! -z "$module" ]; then
						echo "Import module: "$module;
						cp -r $dir/../../data/modules/$module.* ~/.config/qad/app/src/main/assets/www/data/modules/;
						i=$[$i + 1];
					else
						break;
					fi
				done
			fi
			cp -r $dir/../../data/qad ~/.config/qad/app/src/main/assets/www/data/;
			cp -r $dir/../../data/fonts ~/.config/qad/app/src/main/assets/www/data/;
			cp -r $dir/../../data/images ~/.config/qad/app/src/main/assets/www/data/;
			cp -r $dir/../../page/$1 ~/.config/qad/app/src/main/assets/www/page/;
			qad_min ~/.config/qad/app/src/main/assets/www/;
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
		cp app/src/main/assets/www/page/$1/qad-icons.zip app/src/main/;
		cd ~/.config/qad/app/src/main/;
		unzip -o qad-icons.zip;
		rm icon.png qad-icons.zip;
		cd ~/.config/qad/;
		rm app/src/main/assets/www/page/$1/qad-icons.zip;
		sed '0,/local = "";/s/local = "";/local = "file:\/\/\/android_asset\/www\/page\/'$1'\/index.html";/' -i app/src/main/java/com/example/app/MainActivity.java;
		sed -r 's/applicationId ".*"/applicationId "'$domain'.'$company'.'$1'"/g' app/build.gradle  > app/build.gen.gradle;
		mv app/build.gen.gradle app/build.gradle;
		sed -r 's/versionCode .*/versionCode '$date'/g' app/build.gradle  > app/build.gen.gradle;
		mv app/build.gen.gradle app/build.gradle;
		sed -r 's/versionName ".*"/versionName "'$2'"/g' app/build.gradle  > app/build.gen.gradle;
		mv app/build.gen.gradle app/build.gradle;
		sed -r "s/android:label=\".*\"/android:label=\"$3\"/g" app/src/main/AndroidManifest.xml  > app/src/main/AndroidManifest.gen.xml;
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
		if [ ! -z "$4" ]; then
			if [ "$4" == "new" ] || [ "$4" == "key" ]; then
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
			gradle build && apk="app/build/outputs/apk/app-release.apk";
		else
			gradle build && apk="app/build/outputs/apk/app-debug.apk";
		fi
		if [ "`adb devices | grep device | wc -l`" != "1" ] && [ ! -z "$apk" ]; then
			adb install -r $apk;
		fi
	fi
	if [ -e "/usr/bin/gdrive" ]; then
		cd ~/.config/qad/;
		if [ "`gdrive list -q "name = 'qad-make'" | grep 'qad-make' | wc -l`" == "0" ]; then
			gdrive mkdir qad-make;
		fi
		dm=`gdrive list -q "name = 'qad-make'" | grep 'qad-make' | sed -r 's/ .+//'`;
		if [ "`gdrive list -q "name = '$1'" --absolute | grep 'qad-make/' | wc -l`" == "0" ]; then
			gdrive mkdir -p $dm $1;
		fi
		dp=`gdrive list -q "name = '$1'" --absolute | grep 'qad-make/' | sed -r 's/ .+//'`;
		if [ ! -z "$4" ]; then
			f='public';
		else
			f='alpha';
		fi
		if [ "`gdrive list -q "name = '$f'" --absolute | grep 'qad-make/'$1 | wc -l`" == "0" ]; then
			gdrive mkdir -p $dp $f;
		fi
		df=`gdrive list -q "name = '$f'" --absolute | grep 'qad-make/'$1'/'$f | sed -r 's/ .+//'`;
		echo $f'::'$df;
		if [ -z "$os" ] || [ "$(echo $os | grep -io "android")" = "android" ]; then
			if [ ! -z "$apk" ]; then
				if [ ! -z "$4" ]; then
					mv app/build/outputs/apk/app-release.apk app/build/outputs/apk/android-$date.apk;
				else
					mv app/build/outputs/apk/app-debug.apk app/build/outputs/apk/android-$date.apk;
				fi
				gdrive upload -p $df 'app/build/outputs/apk/android-'$date'.apk';
			fi
		fi
	fi
fi
