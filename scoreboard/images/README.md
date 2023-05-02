# Origin of Images

Favicon: https://en.wikipedia.org/wiki/Flag_of_Japan#/media/File:Flag_of_Japan.svg

License: Public domain

Generation: First made the image square with Inkscape, then:
$ convert -density 256x256 -background transparent Flag_of_Japan.svg -define icon:auto-resize -colors 256 favicon.ico
