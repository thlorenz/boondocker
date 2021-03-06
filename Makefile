BIN=./node_modules/.bin
WATCHIFY=$(BIN)/watchify
BROWSERIFY=$(BIN)/browserify
UGLIFYJS=$(BIN)/uglifyjs
LINKLOCAL=$(BIN)/linklocal
WS=$(BIN)/ws

ROOT=./web
DEPS=$(ROOT)/deps
BUILD=$(ROOT)/build


REQUIRE_VENDORS=-r react -r react-dom -r redux
EXCLUDE_VENDORS=-x react -x react-dom -x redux

REQUIRE_DATA=-r boondocker.fs-usda-ridb
EXCLUDE_DATA=-x boondocker.fs-usda-ridb

NOPARSE_MODULES=

ENTRY=web/js/main.js
OUTPUT=$(BUILD)/bundle.js
DATA=$(BUILD)/data.js

PORT:=3333

LIVERELOAD=-p livereactload

build: bundle index

clean:
	rm -rf ./web/index.html
	rm -rf $(BUILD)/*

index:
	tools/gen-index-html

link:
	$(LINKLOCAL)

watch:
	$(WATCHIFY) -d $(EXCLUDE_VENDORS) $(EXCLUDE_DATA) $(NOPARSE_MODULES) $(LIVERELOAD) $(ENTRY) -o $(OUTPUT)

watch-raw:
	$(WATCHIFY) $(EXCLUDE_VENDORS) $(EXCLUDE_DATA) $(NOPARSE_MODULES) $(LIVERELOAD) $(ENTRY) -o $(OUTPUT)

watch-noreload:
	$(WATCHIFY) -d $(EXCLUDE_VENDORS) $(EXCLUDE_DATA) $(NOPARSE_MODULES) $(ENTRY) -o $(OUTPUT)

bundle:
	$(BROWSERIFY) -d $(EXCLUDE_VENDORS) $(EXCLUDE_DATA) $(NOPARSE_MODULES) $(ENTRY) -o $(OUTPUT)

bundle-raw:
	$(BROWSERIFY) $(EXCLUDE_VENDORS) $(EXCLUDE_DATA) $(NOPARSE_MODULES) $(ENTRY) -o $(OUTPUT)

bundle-min:
	$(BROWSERIFY) $(EXCLUDE_VENDORS) $(EXCLUDE_DATA) $(NOPARSE_MODULES) $(ENTRY) | $(UGLIFYJS) > $(OUTPUT)

vendor:
	$(BROWSERIFY) -d $(REQUIRE_VENDORS) -o web/build/vendor.js

vendor-raw:
	$(BROWSERIFY) $(REQUIRE_VENDORS) -o web/build/vendor.js

# uglify shaves only about 1MB off here .. gotta make sure we send this gzipped
# however github sends a 304 for unmodified code, so we should be good on that front
data: link
	./tools/prep-data
	$(BROWSERIFY) $(REQUIRE_DATA) | $(UGLIFYJS) > $(DATA) 

deploy:
	./tools/deploy

serve:
	echo http://localhost:$(PORT) && \
	$(WS) --port $(PORT) --directory $(ROOT) --compress
