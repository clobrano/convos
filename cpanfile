# You can install this projct with curl -L http://cpanmin.us | perl - https://github.com/jhthorsen/convos/archive/master.tar.gz
requires "IO::Socket::SSL"                => "1.94";  # Need to installed first, so "cpanm -M" works
requires "Crypt::Eksblowfish"             => "0.009";
requires "File::HomeDir"                  => "1.00";
requires "File::ReadBackwards"            => "1.05";
requires "JSON::Validator"                => "0.91";
requires "LinkEmbedder"                   => "0.05";
requires "Mojo::IOLoop::ForkCall"         => "0.17";
requires "Mojo::IRC"                      => "0.44";
requires "Mojolicious"                    => "7.29";
requires "Mojolicious::Plugin::AssetPack" => "1.41";
requires "Mojolicious::Plugin::OpenAPI"   => "1.06";
requires "Parse::IRC"                     => "1.20";
requires "Time::Piece"                    => "1.20";

on develop => sub {
  requires "CSS::Minifier::XS"          => "0.09";
  requires "CSS::Sass"                  => "3.3.0";
  requires "JavaScript::Minifier::XS"   => "0.11";
  requires "Test::Mojo::Role::Selenium" => "0.09";
};

test_requires "Test::Deep" => "0.11";
test_requires "Test::More" => "0.88";
