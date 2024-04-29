#!/usr/bin/perl

use utf8;
use strict;
use warnings;
use Encode qw(encode_utf8);
use Encode qw(decode_utf8);
use Plack::Request;
use Plack::Response;
use Plack::Builder;
use Time::Piece;

sub read_ {
    my ($file_path) = @_;
    my $content = '';
    open my $fh, '<:encoding(UTF-8)', $file_path or die "Can't open $file_path: $!";
    {
        local $/;  # 临时取消输入记录分隔符，使文件模式变为 'slurp' 模式
        $content = <$fh>;
    }
    close $fh;
    return $content;
}

my $app = sub {
    my $env = shift;
    my $t = localtime;
    my $git_s_repo_path = '/root/ted/shahrazad';
    my $git_b_repo_path = '/root/ted/katun';
    
    my $request = Plack::Request->new($env);
    my $path_info = $request->path_info;
    my $res = Plack::Response->new(200);
    my $output;
    
    if ($path_info eq '/shahrazad/postreceive') {
        $output = `cd $git_s_repo_path && git pull`;
    } elsif ($path_info eq '/katun/postreceive') {
        $output = `cd $git_b_repo_path && git pull`;
    } elsif ($path_info eq '/katun/codice') {
        $output = read_($t->strftime("/root/ted/katun/codices_%Y%m.log"));
    } elsif ($path_info eq '/katun/word') {
        $output = read_($t->strftime("/root/ted/katun/words_%Y.log"));
    } elsif ($path_info eq '/katun/note') {
        $output = read_($t->strftime("/root/ted/katun/notes_%Y%m.log"));
    } else {
        $res->status(404);
        $output = "Not Found";
    }
    $res->content_type('text/plain; charset=UTF-8');
    $res->body(encode_utf8($output));
    return $res->finalize;
};

builder {
    mount '/dogdoor' => $app;
};
