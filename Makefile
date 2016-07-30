BIN=./node_modules/.bin
WATCHIFY=$(BIN)/watchify
BROWSERIFY=$(BIN)/browserify
UGLIFYJS=$(BIN)/uglifyjs

ROOT=./web
DEPS=$(ROOT)/deps


REQUIRE_VENDORS=-r react -r react-dom -r redux
EXCLUDE_MODULES=-x react -x react-dom -x redux
NOPARSE_MODULES=

ENTRY=web/js/main.js
OUTPUT=web/build/bundle.js

PORT:=33333

LIVERELOAD=-p livereactload

build: bundle index

clean:
	rm -rf $(OUTPUT) ./web/index.html

index:
	tools/gen-index-html

watch:
	$(WATCHIFY) -d $(EXCLUDE_MODULES) $(NOPARSE_MODULES) $(LIVERELOAD) $(ENTRY) -o $(OUTPUT)

watch-raw:
	$(WATCHIFY) $(EXCLUDE_MODULES) $(NOPARSE_MODULES) $(LIVERELOAD) $(ENTRY) -o $(OUTPUT)

watch-noreload:
	$(WATCHIFY) -d $(EXCLUDE_MODULES) $(NOPARSE_MODULES) $(ENTRY) -o $(OUTPUT)

bundle:
	$(BROWSERIFY) -d $(EXCLUDE_MODULES) $(NOPARSE_MODULES) $(ENTRY) -o $(OUTPUT)

bundle-raw:
	$(BROWSERIFY) $(EXCLUDE_MODULES) $(NOPARSE_MODULES) $(ENTRY) -o $(OUTPUT)

bundle-min:
	$(BROWSERIFY) $(EXCLUDE_MODULES) $(NOPARSE_MODULES) $(ENTRY) | $(UGLIFYJS) > $(OUTPUT)

deploy:
	./tools/deploy

vendor:
	$(BROWSERIFY) -d $(REQUIRE_VENDORS) -o web/build/vendor.js

vendor-raw:
	$(BROWSERIFY) $(REQUIRE_VENDORS) -o web/build/vendor.js

serve:
	cd web                        && \
	echo http://localhost:$(PORT) && \
	python -m SimpleHTTPServer $(PORT)
