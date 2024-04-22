#!/usr/bin/perl

use strict;
use warnings;
use Plack::Request;
use Plack::Builder;

my $app = sub {
    my $env = shift;
    my $git_repo_path = '/root/blog/shahrazad';
    my $log_file = '/root/blog/gitwebhook/webhook.log';

    my $request = Plack::Request->new($env);
    my $path_info = $request->path_info;
    
    print $path_info;
    if ($path_info eq '/webhook/github/postreceive') {
        my $output = `cd $git_repo_path && git pull >> $log_file 2>&1`;
        return [200, ['Content-Type' => 'text/plain'], ["Git pull triggered successfully.\n"]];
    } else {
        return [404, ['Content-Type' => 'text/plain'], ["Not found\n"]];
    }
};

builder {
    mount '/webhook' => $app;
};

# nohup plackup -p 8090 git_webhook_server.pl >> webhook.log 2>&1 &
# echo $! >> webhook.log
