.PHONY: build

build:
	rm -rf dist
	rm -rf zips
	npm run build
	bash build.sh

zip:
	bash build.sh