#!/bin/bash
hugo --gc
hugo --cleanDestinationDir 
hugo -d public
